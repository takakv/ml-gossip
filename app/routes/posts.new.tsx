import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { type LoaderFunctionArgs, redirect, useNavigate } from "react-router";

import { requireUser } from "~/utils/auth.server";
import { ApiError } from "~/lib/api-client";
import { useCreatePost, useUploadPostImage } from "~/lib/queries/posts";

interface FileWithPreview extends File {
  preview: string;
}

const ONE_MB = Math.pow(2, 20);
const MAX_FILE_SIZE = 5 * ONE_MB;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUser(request);

  if (user.role === "READER") {
    throw redirect("/posts");
  }

  return null;
};

export default function NewPostRoute() {
  const navigate = useNavigate();

  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState("");

  const uploadImage = useUploadPostImage();
  const createPost = useCreatePost();
  const isSubmitting = uploadImage.isPending || createPost.isPending;

  // https://github.com/react-dropzone/react-dropzone/issues/966
  const handleImagePreview = async (file: any) => {
    // Extract extension from file name or path
    const ext = (
      file.name ? file.name.split(".").pop() : file.path.split(".").pop()
    ).toLowerCase();
    // If heic or heif, convert to jpeg
    if (ext === "heic" || ext === "heif") {
      // Dynamic import of heic2any
      const heic2any = (await import("heic2any")).default;

      // Convert HEIC/HEIF file to JPEG Blob
      const outputBlob = (await heic2any({
        blob: file, // Use the original file object
        toType: "image/jpeg",
        quality: 0.7, // adjust quality as needed
      })) as Blob;
      // Return as object URL
      return URL.createObjectURL(outputBlob);
    } else {
      // If not a HEIC/HEIF file, proceed as normal
      return URL.createObjectURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/heic": [],
    },
    onDrop: async (acceptedFiles) => {
      const previews = await Promise.all(
        acceptedFiles.map(async (file) => {
          const preview = await handleImagePreview(file);
          return Object.assign(file, { preview });
        }),
      );

      setFiles(previews);
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  const thumbs = files.map((file) => (
    <div key={file.name} className="inline-flex w-[100px] h-[100px]">
      <div className="">
        <img
          className="block w-auto h-full m-auto"
          src={file.preview}
          onLoad={() => {
            URL.revokeObjectURL(file.preview);
          }}
          alt="Üleslaetud fail"
        />
      </div>
    </div>
  ));

  useEffect(() => {
    // Make sure to revoke the data uris to avoid memory leaks, will run on unmount
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (title.trim().length === 0) {
      setFormError("Pealkiri ei tohi olla tühi.");
      return;
    }

    const file = files[0];
    if (!content && !file) {
      setFormError("Postitus peab sisaldama teksti või pilti.");
      return;
    }

    try {
      let imageId: string | undefined;
      if (file) {
        const uploaded = await uploadImage.mutateAsync(file);
        imageId = uploaded.fileName;
      }

      const { postId } = await createPost.mutateAsync({
        title,
        content: content || undefined,
        imageId,
      });

      navigate(`/posts/${postId}`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Serveri viga.");
    }
  };

  const borderStyle = "border-2 rounded border-white";
  return (
    <div className="border-b border-pink-500 py-2 px-4">
      <p>Loo postitus</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div>
          <label htmlFor="title">Pealkiri:</label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={borderStyle + " block bg-white"}
          />
        </div>
        <div>
          <label htmlFor="content">Sisu:</label>
          <textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={borderStyle + " block w-full bg-white"}
          />
          <div
            {...getRootProps()}
            className="mt-2 flex flex-col items-center p-6 bg-pink-200 rounded border border-dashed border-pink-500"
          >
            <input {...getInputProps()} name="image" />
            {isDragActive ? (
              <p>Lohista pildid siia ..</p>
            ) : (
              <>
                <p className="hidden md:block">
                  Lohista pilt siia või klõpsa, et valida pilt
                </p>
                <p className="md:hidden">Vajuta siia, et valida pilt</p>
                <span>(max: 1 pilt, 5MB)</span>
                <aside>{thumbs}</aside>
              </>
            )}
          </div>
        </div>
        <div className="text-xs font-semibold text-center tracking-wide text-red-500 w-full">
          {formError}
        </div>
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="button text-center px-4 py-2 bg-pink-400 rounded"
          >
            Postita
          </button>
        </div>
      </form>
    </div>
  );
}
