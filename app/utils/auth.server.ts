import { redirect } from "react-router";

import { apiFetchServer } from "~/lib/api-client";
import type { CurrentUser } from "~/lib/queries/user";

export async function getUser(request: Request): Promise<CurrentUser | null> {
  try {
    return await apiFetchServer<CurrentUser>(request, "/account");
  } catch {
    return null;
  }
}

export async function requireUser(
  request: Request,
  redirectTo: string = new URL(request.url).pathname,
): Promise<CurrentUser> {
  const user = await getUser(request);
  if (!user) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return user;
}
