import type { UseQueryResult } from "@tanstack/react-query";

import { PostCard } from "~/components/post";
import { Pagination } from "~/components/pagination";
import { ApiError } from "~/lib/api-client";
import type { PostsPage } from "~/lib/queries/posts";

interface PostListProps {
  query: UseQueryResult<PostsPage>;
}

export function PostList({ query }: PostListProps) {
  if (query.isPending) return <p className="p-4">Laadin...</p>;

  if (query.isError)
    return (
      <p className="p-4 text-destructive">
        {query.error instanceof ApiError
          ? query.error.message
          : "Serveri viga."}
      </p>
    );

  const { data } = query;

  return (
    <>
      <ul>
        {data.posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            title={post.title}
            content={post.content}
            imageId={post.imageId}
            isLiked={post.isLiked}
            likeCount={post.likeCount}
            createdAt={post.createdAt}
          />
        ))}
      </ul>
      <Pagination currentPage={data.currentPage} totalPages={data.totalPages} />
    </>
  );
}
