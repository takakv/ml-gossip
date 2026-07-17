import { useSearchParams } from "react-router";

import { PostList } from "~/components/post-list";
import { useLikedPosts } from "~/lib/queries/posts";

export default function LikedPostsRoute() {
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") ?? "1", 10) || 1;

  return <PostList query={useLikedPosts(page)} />;
}
