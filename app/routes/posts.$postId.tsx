import { useNavigate, useParams, useRouteLoaderData } from "react-router";

import { cdnPrefix } from "~/utils/vars";
import { ApiError } from "~/lib/api-client";
import { useCurrentUser } from "~/lib/queries/user";
import {
  useApprovePost,
  useDeletePost,
  usePost,
  useSetPostLike,
} from "~/lib/queries/posts";
import type { loader as postsLayoutLoader } from "~/routes/posts";

export default function PostRoute() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const layoutData =
    useRouteLoaderData<typeof postsLayoutLoader>("routes/posts");
  const isAdmin = layoutData?.role === "ADMIN";

  const { data: currentUser } = useCurrentUser();
  const { data: post, isPending, isError, error } = usePost(postId!);

  const setLike = useSetPostLike();
  const approvePost = useApprovePost();
  const deletePost = useDeletePost();

  if (isPending) return <p className="p-4">Laadin...</p>;
  if (isError)
    return (
      <p className="p-4 text-red-500">
        {error instanceof ApiError ? error.message : "Postitust ei leitud."}
      </p>
    );

  const likeCount = post.likeCount;
  const liked = post.isLiked;

  return (
    <>
      {!post.published ? (
        <div className="bg-pink-400 px-4 py-2 text-pink-800">
          <em>Postitus on ootel. Admin peab selle kinnitama.</em>
        </div>
      ) : null}
      <article className="bg-pink-300 px-4 py-2 border-b border-pink-500">
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
        <div className="flex mt-2">
          <button
            type="button"
            className="material-symbols-rounded"
            style={{ fontVariationSettings: `'FILL' ${liked ? 1 : 0}` }}
            disabled={!currentUser || setLike.isPending}
            onClick={() =>
              currentUser &&
              setLike.mutate({
                postId: postId!,
                userId: currentUser.id,
                liked,
              })
            }
          >
            favorite
          </button>
          <span>{likeCount}</span>
        </div>
      </article>
      {isAdmin && (
        <div className="py-4 mx-4">
          {!post.published && (
            <button
              type="button"
              disabled={approvePost.isPending}
              onClick={() => approvePost.mutate(postId!)}
              className="bg-pink-400 px-4 py-2 rounded mr-4 hover:cursor-pointer"
            >
              Kinnita
            </button>
          )}
          <button
            type="button"
            disabled={deletePost.isPending}
            onClick={() =>
              deletePost.mutate(postId!, {
                onSuccess: () => navigate("/posts"),
              })
            }
            className="bg-pink-400 px-4 py-2 rounded hover:cursor-pointer"
          >
            Kustuta
          </button>
        </div>
      )}
    </>
  );
}
