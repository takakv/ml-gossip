import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";

import { currentUserQueryOptions, type CurrentUser } from "~/lib/queries/user";

export async function getUser(
  queryClient: QueryClient,
): Promise<CurrentUser | null> {
  try {
    return await queryClient.ensureQueryData(currentUserQueryOptions);
  } catch {
    return null;
  }
}

export async function requireUser(
  queryClient: QueryClient,
  redirectTo: string,
): Promise<CurrentUser> {
  const user = await getUser(queryClient);
  if (!user) {
    throw redirect({ to: "/login", search: { redirectTo } });
  }
  return user;
}
