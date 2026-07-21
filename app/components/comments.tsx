import { useEffect, useState } from "react";

import { ApiError } from "~/lib/api-client";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "~/lib/queries/posts";
import { useCurrentUser } from "~/lib/queries/user";
import { Button } from "~/components/ui/button.tsx";
import { Textarea } from "~/components/ui/textarea.tsx";

interface CommentsProps {
  postId: string;
}

export const Comments = ({ postId }: CommentsProps) => {
  const [page, setPage] = useState(1);
  const [followLastPage, setFollowLastPage] = useState(false);
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState("");

  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  const canComment = Boolean(currentUser) && currentUser?.role !== "READER";

  const query = useComments(postId, page);
  const createComment = useCreateComment(postId);
  const deleteComment = useDeleteComment(postId);

  const totalPages = query.data?.totalPages;
  useEffect(() => {
    if (!followLastPage || query.isFetching || totalPages === undefined) return;
    setPage(Math.max(totalPages, 1));
    setFollowLastPage(false);
  }, [followLastPage, query.isFetching, totalPages]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!content.trim()) {
      setFormError("Kommentaar ei tohi olla tühi.");
      return;
    }

    try {
      await createComment.mutateAsync(content.trim());
      setContent("");
      setFollowLastPage(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Serveri viga.");
    }
  };

  return (
    <section className="bg-card px-4 py-2 border-b border-border">
      <h4 className="font-bold">Kommentaarid</h4>

      {query.isPending ? (
        <p className="py-2">Laadin...</p>
      ) : query.isError ? (
        <p className="py-2 text-destructive">
          {query.error instanceof ApiError
            ? query.error.message
            : "Serveri viga."}
        </p>
      ) : query.data.comments.length === 0 ? (
        <p className="py-2 text-muted-foreground">Kommentaare veel ei ole.</p>
      ) : (
        <ul className="py-2 flex flex-col gap-2">
          {query.data.comments.map((comment) => {
            const date = new Date(comment.createdAt);
            return (
              <li
                key={comment.id}
                className="border-b border-border pb-2 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-muted-foreground text-xs"
                    suppressHydrationWarning={true} // needed due to the potential client-server timezone mismatch
                  >
                    {date.toLocaleDateString("et-EE", {
                      month: "2-digit",
                      day: "2-digit",
                    })}{" "}
                    @{" "}
                    {date.toLocaleTimeString("et-EE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {comment.isAuthor && (
                    <span className="text-muted-foreground text-xs">
                      (sina)
                    </span>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      className="material-symbols-rounded text-destructive text-base ml-auto"
                      disabled={deleteComment.isPending}
                      onClick={() => deleteComment.mutate(comment.id)}
                    >
                      delete
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{comment.content}</p>
              </li>
            );
          })}
        </ul>
      )}

      {query.data && query.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-2">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Eelmised
          </Button>
          <span>
            {query.data.currentPage} / {query.data.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={page >= query.data.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Järgmised
          </Button>
        </div>
      )}

      {canComment ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 py-2">
          <Textarea
            id="comment"
            name="comment"
            placeholder="Lisa kommentaar"
            maxLength={5000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {formError && (
            <div className="text-xs font-semibold text-center tracking-wide text-destructive w-full">
              {formError}
            </div>
          )}
          <div>
            <Button type="submit" disabled={createComment.isPending}>
              Kommenteeri
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
};
