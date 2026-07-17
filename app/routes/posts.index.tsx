import { createFileRoute } from "@tanstack/react-router";

import { PostList } from "~/components/post-list";
import { usePosts } from "~/lib/queries/posts";
import { parsePage } from "~/utils/search";

export const Route = createFileRoute("/posts/")({
  validateSearch: (search: Record<string, unknown>): { page?: number } => {
    const page = parsePage(search.page);
    return page > 1 ? { page } : {};
  },
  component: PostsIndexRoute,
});

function PostsIndexRoute() {
  const { page = 1 } = Route.useSearch();

  return <PostList query={usePosts(page)} />;
}
