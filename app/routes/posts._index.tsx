import { useSearchParams } from "react-router";

import { PostList } from "~/components/post-list";
import { usePosts } from "~/lib/queries/posts";

export default function PostsIndexRoute() {
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") ?? "1", 10) || 1;

  return <PostList query={usePosts(page)} />;
}
