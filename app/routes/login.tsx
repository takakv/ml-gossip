import { useState } from "react";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";

import { Layout } from "~/components/layout";
import { FormField } from "~/components/form-field";
import { getUser } from "~/utils/auth";
import { ApiError, apiFetch } from "~/lib/api-client";
import { validatePassword, validateUsername } from "~/utils/validators";

export const Route = createFileRoute("/login")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { redirectTo?: string } => ({
    redirectTo:
      typeof search.redirectTo === "string" ? search.redirectTo : undefined,
  }),
  loader: async ({ context }) => {
    // If there's already a user in the session, redirect to the home page
    if (await getUser(context.queryClient)) {
      throw redirect({ to: "/" });
    }
  },
  component: Login,
});

type LoginResponse = { username: string; role: string };

function Login() {
  const navigate = useNavigate();
  const { redirectTo } = Route.useSearch();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const loginMutation = useMutation({
    mutationFn: (vars: { username: string; password: string }) =>
      apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(vars),
      }),
    onSuccess: () => {
      navigate({ to: redirectTo || "/" } as Parameters<typeof navigate>[0]);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const cleanedUsername = username.toLocaleLowerCase("et");
    const nextErrors = {
      username: validateUsername(cleanedUsername) ?? undefined,
      password: validatePassword(password),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    loginMutation.mutate({ username: cleanedUsername, password });
  };

  return (
    <Layout>
      <div className="h-full justify-center items-center flex flex-col gap-y-4">
        <Link to="/register">
          <button className="absolute top-8 right-8 rounded-xl bg-pink-400 font-semibold px-3 py-2 transition duration-300 ease-in-out hover:bg-pink-500 hover:-translate-y-1">
            Loo konto
          </button>
        </Link>
        <h2 className="text-5xl font-extrabold text-pink-200">Go-go-gossip</h2>

        <p className="font-semibold text-slate-300">Logi sisse</p>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-pink-200 mx-4 p-4"
        >
          <div className="text-xs font-semibold text-center tracking-wide text-red-500 w-full">
            {loginMutation.isError
              ? loginMutation.error instanceof ApiError
                ? loginMutation.error.message
                : "Serveri viga."
              : ""}
          </div>
          <FormField
            htmlFor="username"
            label="Kasutajanimi"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={errors.username}
          />

          <FormField
            htmlFor="password"
            type="password"
            label="Salasõna"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          <div className="w-full text-center">
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="rounded-xl mt-2 bg-pink-400 px-3 py-2 font-semibold transition duration-300 ease-in-out hover:bg-pink-500 hover:-translate-y-1"
            >
              Logi sisse
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
