import fs, { createReadStream } from "node:fs";
import { createHash } from "node:crypto";

import { useEffect, useState } from "react";
import {
  ActionFunctionArgs,
  MaxPartSizeExceededError,
  NodeOnDiskFile,
  redirect,
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { Form } from "@remix-run/react";
import { useDropzone } from "react-dropzone";

import { prisma } from "~/utils/db.server";
import { requireUserId } from "~/utils/auth.server";
import { badRequest, internalServerError } from "~/utils/request.server";

interface FileWithPreview extends File {
  preview: string;
}

type newPostType = {
  title: string;
  content?: string;
  imageId?: string;
};

const MAX_FILE_SIZE = 5e6;
const IMG_DIR = "./public/img";

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request);
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: { shift: true },
  });

  if (!userData?.shift) {
    return internalServerError({
      error: "User shift not found.",
    });
  }

  let form = null;

  try {
    const uploadHandler = unstable_composeUploadHandlers(
      // get the image as a file
      unstable_createFileUploadHandler({
        maxPartSize: MAX_FILE_SIZE,
        directory: IMG_DIR,
        file: ({ filename }) => filename,
      }),
      // parse everything else into memory
      unstable_createMemoryUploadHandler(),
    );
    form = await unstable_parseMultipartFormData(request, uploadHandler);
  } catch (e) {
    console.error(e);
    if (e instanceof MaxPartSizeExceededError) {
      return badRequest({
        fieldErrors: null,
        fields: null,
        formError: "File size too large.",
      });
    }
    return badRequest({
      fieldErrors: null,
      fields: null,
      formError: "Internal server error.",
    });
  }

  const title = form.get("title");
  const content = form.get("content");
  const image = form.get("image");

  if (typeof title !== "string" || (content && typeof content !== "string")) {
    return badRequest({
      fieldErrors: null,
      fields: null,
      formError: "Form not submitted correctly.",
    });
  }

  if (title.length === 0) {
    return badRequest({
      fieldErrors: null,
      fields: null,
      formError: "Title cannot be empty.",
    });
  }

  const hasImage = (image as Blob).size !== 0;

  if (!content && !hasImage) {
    return badRequest({
      fieldErrors: null,
      fields: null,
      formError: "There must be text or an image.",
    });
  }

  let filename = "";

  if (hasImage) {
    const imageFile = image as NodeOnDiskFile;

    try {
      const fileHash: string = await new Promise((resolve, reject) => {
        const hash = createHash("sha256");
        const rs = createReadStream(imageFile.getFilePath());
        rs.on("error", reject);
        rs.on("data", (chunk) => hash.update(chunk));
        rs.on("end", () => resolve(hash.digest("hex")));
      });

      let extension = "";
      switch (imageFile.type) {
        case "image/png":
          extension = ".png";
          break;
        case "image/jpeg":
          extension = ".jpeg";
          break;
        default:
          throw new Error(
            "invalid or unsupported image type: " + imageFile.type,
          );
      }

      filename = fileHash + extension;
    } catch (e) {
      console.error(e);
    }

    fs.rename(imageFile.getFilePath(), `${IMG_DIR}/${filename}`, (err) => {
      if (err) console.error(err);
    });
  }

  // TODO: replace custom type with Prisma's generated type
  const fields: newPostType = { title };
  if (filename) {
    fields.imageId = filename;
  }
  if (content) {
    fields.content = content;
  }

  const post = await prisma.post.create({
    data: { ...fields, authorId: userId, shift: userData.shift },
  });
  return redirect(`/posts/${post.id}`);
};

export default function NewPostRoute() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);

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
    onDrop: async (acceptedFiles, fileRejections) => {
      const previews = await Promise.all(
        acceptedFiles.map(async (file) => {
          const preview = await handleImagePreview(file);
          return Object.assign(file, { preview });
        }),
      );

      setFiles(previews);
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE, // 2MB
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

  const borderStyle = "border-2 rounded";
  return (
    <div className="border-b border-pink-500 py-2 px-4">
      <p>Loo postitus</p>
      <Form
        method="post"
        encType="multipart/form-data"
        className="flex flex-col gap-2"
      >
        <div>
          <label htmlFor="title">Pealkiri:</label>
          <input
            type="text"
            name="title"
            required
            className={borderStyle + " block"}
          />
        </div>
        <div>
          <label htmlFor="content">Sisu:</label>
          <textarea name="content" className={borderStyle + " block w-full"} />
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
        <div>
          <button
            type="submit"
            className="button text-center px-4 py-2 bg-pink-400 rounded"
          >
            Postita
          </button>
        </div>
      </Form>
    </div>
  );
}
