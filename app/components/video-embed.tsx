import { useState } from "react";

import { streamEmbedPrefix, streamThumbnail } from "~/utils/vars";

interface VideoEmbedProps {
  videoId: string;
}

export const VideoEmbed = ({ videoId }: VideoEmbedProps) => {
  const [thumbFailed, setThumbFailed] = useState(false);

  const iframe = (
    <iframe
      src={`${streamEmbedPrefix}${videoId}?autoplay=false&preload=false`}
      loading="lazy"
      className="absolute inset-0 h-full w-full rounded border-0"
      allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
      allowFullScreen
    />
  );

  if (thumbFailed) {
    return (
      <div className="relative mx-auto aspect-video w-full max-w-125">
        {iframe}
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-fit max-w-125">
      <img
        src={streamThumbnail(videoId)}
        alt=""
        className="block max-h-[70vh] max-w-full rounded"
        onError={() => setThumbFailed(true)}
      />
      {iframe}
    </div>
  );
};
