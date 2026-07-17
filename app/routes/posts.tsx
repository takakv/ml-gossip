import { createFileRoute, Outlet } from "@tanstack/react-router";

import { requireUser } from "~/utils/auth";
import { useCurrentUser } from "~/lib/queries/user";
import { MobileSidebar, Sidebar } from "~/components/sidebar";

export const Route = createFileRoute("/posts")({
  loader: async ({ context, location }) => {
    await requireUser(context.queryClient, location.href);
  },
  component: PostsRoute,
});

function PostsRoute() {
  const { data: user } = useCurrentUser();
  if (!user) return null;

  return (
    <>
      <MobileSidebar role={user.role} />
      <div className="flex bg-pink-200">
        <Sidebar role={user.role} />
        <main className="w-full h-screen overflow-y-scroll">
          <section className="bg-pink-300 mb-14 sm:mb-0">
            <h2 className="text-center font-bold py-2 border-b border-pink-500">
              Merelaagri gossip
            </h2>
            <Outlet />
          </section>
        </main>
      </div>
    </>
  );
}
