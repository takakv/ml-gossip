import { createFileRoute } from "@tanstack/react-router";

import { PostList } from "~/components/post-list";
import { useMyPosts } from "~/lib/queries/posts";
import { parsePage } from "~/utils/search";

export const Route = createFileRoute("/posts/my")({
  validateSearch: (search: Record<string, unknown>): { page?: number } => {
    const page = parsePage(search.page);
    return page > 1 ? { page } : {};
  },
  component: MyPostsRoute,
});

function MyPostsRoute() {
  const { page = 1 } = Route.useSearch();

  return <PostList query={useMyPosts(page)} />;
}
