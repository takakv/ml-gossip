import { createFileRoute, redirect } from "@tanstack/react-router";

import { requireUser } from "~/utils/auth";
import { PostList } from "~/components/post-list";
import { useWaitlistPosts } from "~/lib/queries/posts";
import { parsePage } from "~/utils/search";

export const Route = createFileRoute("/posts/waitlist")({
  validateSearch: (search: Record<string, unknown>): { page?: number } => {
    const page = parsePage(search.page);
    return page > 1 ? { page } : {};
  },
  loader: async ({ context, location }) => {
    const user = await requireUser(context.queryClient, location.href);
    if (user.role !== "ADMIN") {
      throw redirect({ to: "/" });
    }
  },
  component: ApprovePostRoute,
});

function ApprovePostRoute() {
  const { page = 1 } = Route.useSearch();

  return <PostList query={useWaitlistPosts(page)} />;
}
