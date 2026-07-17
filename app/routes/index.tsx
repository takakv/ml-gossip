import { createFileRoute, redirect } from "@tanstack/react-router";

import { requireUser } from "~/utils/auth";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await requireUser(context.queryClient, "/");
    throw redirect({ to: "/posts" });
  },
  component: Home,
});

function Home() {
  return <h2>Home Page</h2>;
}
