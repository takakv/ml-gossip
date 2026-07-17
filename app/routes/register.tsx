import { useState } from "react";
import {
  Link,
  type LoaderFunctionArgs,
  redirect,
  useNavigate,
} from "react-router";
import { useMutation } from "@tanstack/react-query";

import { Layout } from "~/components/layout";
import { FormField } from "~/components/form-field";
import { getUser } from "~/utils/auth.server";
import { ApiError, apiFetch } from "~/lib/api-client";
import { validatePassword, validateUsername } from "~/utils/validators";
import type { Role } from "~/lib/queries/user";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // If there's already a user in the session, redirect to the home page
  return (await getUser(request)) ? redirect("/") : null;
};

type CodeCheckResponse = { role: Role; username?: string };
type RegisterResponse = { id: string; username: string; role: string };

export default function Register() {
  const navigate = useNavigate();

  const [inviteCode, setInviteCode] = useState("");
  const [inviteCodeError, setInviteCodeError] = useState("");
  const [codeInfo, setCodeInfo] = useState<CodeCheckResponse | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const checkCode = useMutation({
    mutationFn: (code: string) =>
      apiFetch<CodeCheckResponse>(`/codes/${encodeURIComponent(code)}`),
    onSuccess: (data) => {
      setCodeInfo(data);
      setInviteCodeError("");
      if (data.role === "READER" && data.username) {
        setUsername(data.username);
      }
    },
    onError: (err) => {
      setInviteCodeError(
        err instanceof ApiError ? err.message : "Serveri viga.",
      );
    },
  });

  const registerMutation = useMutation({
    mutationFn: (vars: { token: string; username: string; password: string }) =>
      apiFetch<RegisterResponse>("/users", {
        method: "POST",
        body: JSON.stringify(vars),
      }),
    onSuccess: () => navigate("/"),
  });

  const handleCheckCode = (event: React.FormEvent) => {
    event.preventDefault();
    setInviteCodeError("");

    if (inviteCode.length < 5) {
      setInviteCodeError("Kood peab olema vähemalt 5 tähemärki pikk");
      return;
    }

    checkCode.mutate(inviteCode);
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();

    const isAnon = codeInfo?.role === "READER";
    const cleanedUsername = username.toLocaleLowerCase("et");
    const nextErrors = {
      username: isAnon
        ? undefined
        : (validateUsername(cleanedUsername) ?? undefined),
      password: validatePassword(password),
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    registerMutation.mutate({
      token: inviteCode,
      username: cleanedUsername,
      password,
    });
  };

  const codeIsValid = codeInfo !== null;

  return (
    <Layout>
      <div className="h-full justify-center items-center flex flex-col gap-y-4">
        <Link to="/login">
          <button className="absolute top-8 right-8 rounded-xl bg-pink-400 font-semibold px-3 py-2 transition duration-300 ease-in-out hover:bg-pink-500 hover:-translate-y-1">
            Logi sisse
          </button>
        </Link>
        <h2 className="text-5xl font-extrabold text-pink-200">Go-go-gossip</h2>

        <p className="font-semibold text-slate-300">Loo konto</p>

        {!codeIsValid && (
          <form
            onSubmit={handleCheckCode}
            className="rounded-2xl bg-pink-200 mx-4 p-4"
          >
            <FormField
              htmlFor="inviteCode"
              label="Kutsekood"
              onChange={(e) => setInviteCode(e.target.value)}
              value={inviteCode}
              error={inviteCodeError}
            />
            <div className="w-full text-center">
              <button
                type="submit"
                disabled={checkCode.isPending}
                className="rounded-xl mt-2 bg-pink-400 px-3 py-2 font-semibold transition duration-300 ease-in-out hover:bg-pink-500 hover:-translate-y-1"
              >
                Jätka
              </button>
            </div>
          </form>
        )}

        {codeIsValid && (
          <form
            onSubmit={handleRegister}
            className="rounded-2xl bg-pink-200 mx-4 p-4"
          >
            <div className="text-xs font-semibold text-center tracking-wide text-red-500 w-full">
              {registerMutation.isError
                ? registerMutation.error instanceof ApiError
                  ? registerMutation.error.message
                  : "Serveri viga."
                : ""}
            </div>

            <FormField
              htmlFor="username"
              label="Kasutajanimi"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={fieldErrors.username}
              disabled={codeInfo?.role === "READER"}
            />

            <FormField
              htmlFor="password"
              type="password"
              label="Salasõna"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
            />

            <div className="w-full text-center">
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="rounded-xl mt-2 bg-pink-400 px-3 py-2 font-semibold transition duration-300 ease-in-out hover:bg-pink-500 hover:-translate-y-1"
              >
                Loo konto
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
