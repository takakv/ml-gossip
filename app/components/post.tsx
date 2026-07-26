import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { cdnPrefix, streamThumbnail } from "~/utils/vars";
import { useSetPostLike } from "~/lib/queries/posts";
import { useCurrentUser } from "~/lib/queries/user";

interface PostProps {
  id: string;
  title: string;
  content: string | null;
  imageId: string | null;
  videoId: string | null;
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export const PostCard = ({
  id,
  title,
  content,
  imageId,
  videoId,
  isLiked,
  likeCount,
  commentCount,
  createdAt,
}: PostProps) => {
  const date = new Date(createdAt);
  const localisedDate = date.toLocaleDateString("et-EE", {
    // year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
  const localisedTime = date.toLocaleTimeString("et-EE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const { data: currentUser } = useCurrentUser();
  const setLike = useSetPostLike();

  const [thumbFailed, setThumbFailed] = useState(false);

  return (
    <li className="border-b border-border">
      <div className="px-4 bg-card">
        <Link to="/posts/$postId" params={{ postId: id }}>
          <article className="py-2">
            <div className="flex items-center">
              <h3 className="font-bold">{title}</h3>
              <span
                className="ml-2 text-muted-foreground text-xs"
                suppressHydrationWarning={true} // needed due to the potential client-server timezone mismatch
              >
                {localisedDate} @ {localisedTime}
              </span>
            </div>
            <p className="line-clamp-5 whitespace-pre-wrap">{content}</p>
            {imageId ? (
              <div className="overflow-hidden max-h-125 max-w-100 rounded">
                <img
                  src={cdnPrefix + imageId}
                  className="w-auto rounded max-h-50"
                />
              </div>
            ) : videoId ? (
              thumbFailed ? (
                <div className="relative flex h-50 max-w-100 items-center justify-center rounded bg-muted">
                  <span className="material-symbols-rounded text-6xl text-foreground/70">
                    play_circle
                  </span>
                </div>
              ) : (
                <div className="relative w-fit">
                  <img
                    src={streamThumbnail(videoId)}
                    className="block max-h-50 w-auto rounded"
                    onError={() => setThumbFailed(true)}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-rounded text-6xl text-white/90 drop-shadow-lg">
                      play_circle
                    </span>
                  </div>
                </div>
              )
            ) : (
              ""
            )}
          </article>
        </Link>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              name="intent"
              className="material-symbols-rounded text-chart-2"
              style={{ fontVariationSettings: `'FILL' ${isLiked ? 1 : 0}` }}
              disabled={!currentUser || setLike.isPending}
              onClick={() =>
                currentUser &&
                setLike.mutate({
                  postId: id,
                  userId: currentUser.id,
                  liked: isLiked,
                })
              }
            >
              favorite
            </button>
            <span>{likeCount}</span>
          </div>
          <Link
            to="/posts/$postId"
            params={{ postId: id }}
            className="flex items-center gap-1 text-muted-foreground"
          >
            <span className="material-symbols-rounded">chat_bubble</span>
            <span>{commentCount}</span>
          </Link>
        </div>
      </div>
    </li>
  );
};
