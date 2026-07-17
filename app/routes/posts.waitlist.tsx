import {
  type LoaderFunctionArgs,
  redirect,
  useSearchParams,
} from "react-router";

import { requireUser } from "~/utils/auth.server";
import { PostList } from "~/components/post-list";
import { useWaitlistPosts } from "~/lib/queries/posts";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUser(request);

  if (user.role !== "ADMIN") {
    throw redirect(`/`);
  }

  return null;
};

export default function ApprovePostRoute() {
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") ?? "1", 10) || 1;

  return <PostList query={useWaitlistPosts(page)} />;
}
