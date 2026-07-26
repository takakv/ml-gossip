import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { requireUser } from "~/utils/auth";
import { ApiError } from "~/lib/api-client";
import {
  useCreatePost,
  usePostConfig,
  useUploadPostImage,
  useUploadPostVideo,
} from "~/lib/queries/posts";

import { Field, FieldLabel } from "~/components/ui/field.tsx";
import { Input } from "~/components/ui/input.tsx";
import { Textarea } from "~/components/ui/textarea.tsx";
import { Button } from "~/components/ui/button.tsx";

interface FileWithPreview extends File {
  preview: string;
}

const ONE_MB = Math.pow(2, 20);

const isVideoFile = (file: File) => file.type.startsWith("video/");

const formatMegabytes = (bytes: number) => `${Math.round(bytes / ONE_MB)}MB`;

export const Route = createFileRoute("/posts/new")({
  loader: async ({ context, location }) => {
    const user = await requireUser(context.queryClient, location.href);
    if (user.role === "READER") {
      throw redirect({ to: "/posts" });
    }
  },
  component: NewPostRoute,
});

function NewPostRoute() {
  const navigate = useNavigate();

  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState("");

  const { data: config } = usePostConfig();

  const uploadImage = useUploadPostImage();
  const uploadVideo = useUploadPostVideo();
  const createPost = useCreatePost();
  const isSubmitting =
    uploadImage.isPending || uploadVideo.isPending || createPost.isPending;

  // https://github.com/react-dropzone/react-dropzone/issues/966
  const createPreviewUrl = async (file: any) => {
    if (isVideoFile(file)) {
      return URL.createObjectURL(file);
    }

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
      "video/mp4": [],
      "video/quicktime": [],
    },
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // The dropzone caps everything at the (larger) video limit, so enforce
      // the tighter image limit here.
      if (
        config &&
        !isVideoFile(file) &&
        file.size > config.maxImageSizeBytes
      ) {
        setFormError(
          `Pilt on liiga suur. Maksimaalne lubatud suurus on ${formatMegabytes(
            config.maxImageSizeBytes,
          )}.`,
        );
        return;
      }

      setFormError("");
      const preview = await createPreviewUrl(file);
      setFiles([Object.assign(file, { preview })]);
    },
    maxFiles: 1,
    maxSize: config?.maxVideoSizeBytes,
  });

  const file = files[0];

  const preview = file ? (
    <div className="inline-flex max-w-50">
      {isVideoFile(file) ? (
        <video src={file.preview} controls className="max-h-37.5 rounded" />
      ) : (
        <img
          className="block m-auto max-h-25 w-auto"
          src={file.preview}
          onLoad={() => {
            URL.revokeObjectURL(file.preview);
          }}
          alt="Üleslaetud fail"
        />
      )}
    </div>
  ) : null;

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

    if (!content && !file) {
      setFormError("Postitus peab sisaldama teksti, pilti või videot.");
      return;
    }

    try {
      let imageId: string | undefined;
      let videoId: string | undefined;
      if (file) {
        if (isVideoFile(file)) {
          const uploaded = await uploadVideo.mutateAsync(file);
          videoId = uploaded.videoId;
        } else {
          const uploaded = await uploadImage.mutateAsync(file);
          imageId = uploaded.fileName;
        }
      }

      const { postId } = await createPost.mutateAsync({
        title,
        content: content || undefined,
        imageId,
        videoId,
      });

      navigate({ to: "/posts/$postId", params: { postId } });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Serveri viga.");
    }
  };

  return (
    <div className="border-b border-border py-2 px-4 bg-card">
      <p>Loo postitus</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Field>
          <FieldLabel htmlFor="title">Pealkiri</FieldLabel>
          <Input
            type="text"
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="content">Sisu</FieldLabel>
          <Textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div
            {...getRootProps()}
            className="mt-2 flex flex-col items-center p-6 bg-muted rounded-2xl border border-dashed border-border"
          >
            <input {...getInputProps()} name="media" />
            {isDragActive ? (
              <p>Lohista fail siia ..</p>
            ) : (
              <>
                <p className="hidden md:block">
                  Lohista pilt või video siia või klõpsa, et valida fail
                </p>
                <p className="md:hidden">
                  Vajuta siia, et valida pilt või video
                </p>
                <span>
                  {config
                    ? `(max: 1 fail, pilt ${formatMegabytes(
                        config.maxImageSizeBytes,
                      )}, video ${formatMegabytes(
                        config.maxVideoSizeBytes,
                      )} / ${config.maxVideoDurationSeconds}s)`
                    : "(max: 1 fail)"}
                </span>
                <aside>{preview}</aside>
              </>
            )}
          </div>
        </Field>
        <div className="text-xs font-semibold text-center tracking-wide text-destructive w-full">
          {formError}
        </div>
        <div>
          <Button type="submit" disabled={isSubmitting}>
            Postita
          </Button>
        </div>
      </form>
    </div>
  );
}
