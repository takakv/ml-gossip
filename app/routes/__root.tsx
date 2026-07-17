import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
}

function NotFound() {
  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>404</h1>
      <p>Lehte ei leitud.</p>
    </main>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>Oops!</h1>
      <p>
        {import.meta.env.DEV ? error.message : "An unexpected error occurred."}
      </p>
      {import.meta.env.DEV && error.stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{error.stack}</code>
        </pre>
      )}
    </main>
  );
}
