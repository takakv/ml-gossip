import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { cdnPrefix } from "~/utils/vars";
import { ApiError } from "~/lib/api-client";
import { useCurrentUser } from "~/lib/queries/user";
import {
  useApprovePost,
  useDeletePost,
  usePost,
  useSetPostLike,
} from "~/lib/queries/posts";
import { Button } from "~/components/ui/button.tsx";
import { Comments } from "~/components/comments";

export const Route = createFileRoute("/posts/$postId")({
  component: PostRoute,
});

function PostRoute() {
  const { postId } = Route.useParams();
  const navigate = useNavigate();

  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";

  const { data: post, isPending, isError, error } = usePost(postId);

  const setLike = useSetPostLike();
  const approvePost = useApprovePost();
  const deletePost = useDeletePost();

  if (isPending) return <p className="p-4">Laadin...</p>;
  if (isError)
    return (
      <p className="p-4 text-destructive">
        {error instanceof ApiError ? error.message : "Postitust ei leitud."}
      </p>
    );

  const likeCount = post.likeCount;
  const liked = post.isLiked;

  return (
    <>
      {!post.published ? (
        <div className="bg-primary px-4 py-2 text-primary-foreground">
          <em>Postitus on ootel. Admin peab selle kinnitama.</em>
        </div>
      ) : null}
      <article className="bg-card px-4 py-2 border-b border-border">
        <h3 className="font-bold">{post.title}</h3>
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.imageId ? (
          <img
            src={cdnPrefix + post.imageId}
            className="max-h-[300px] m-auto"
          />
        ) : (
          ""
        )}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="material-symbols-rounded text-primary"
              style={{ fontVariationSettings: `'FILL' ${liked ? 1 : 0}` }}
              disabled={!currentUser || setLike.isPending}
              onClick={() =>
                currentUser &&
                setLike.mutate({
                  postId: postId,
                  userId: currentUser.id,
                  liked,
                })
              }
            >
              favorite
            </button>
            <span>{likeCount}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="material-symbols-rounded">chat_bubble</span>
            <span>{post.commentCount}</span>
          </div>
        </div>
      </article>
      <Comments postId={postId} />
      {isAdmin && (
        <div className="py-4 mx-4 flex gap-2">
          {!post.published && (
            <Button
              type="button"
              disabled={approvePost.isPending}
              onClick={() => approvePost.mutate(postId)}
            >
              Kinnita
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            disabled={deletePost.isPending}
            onClick={() =>
              deletePost.mutate(postId, {
                onSuccess: () => navigate({ to: "/posts" }),
              })
            }
          >
            Kustuta
          </Button>
        </div>
      )}
    </>
  );
}
