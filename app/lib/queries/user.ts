import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "~/lib/api-client";

export type Role = "USER" | "READER" | "ADMIN";

export type CurrentUser = {
  id: string;
  username: string;
  role: Role;
};

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => apiFetch<CurrentUser>("/account"),
    staleTime: 5 * 60 * 1000,
  });
}
