import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { useMutation } from "@tanstack/react-query";

import { requireUser } from "~/utils/auth.server";
import { ApiError, apiFetch } from "~/lib/api-client";
import {
  validatePassword,
  validatePasswordConfirmation,
} from "~/utils/validators";
import { MobileSidebar, Sidebar } from "~/components/sidebar";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUser(request);
  return { role: user.role, username: user.username };
};

export default function AccountRoute() {
  const data = useLoaderData<typeof loader>();

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<{
    password?: string;
    passwordConfirmation?: string;
  }>({});

  const changePassword = useMutation({
    mutationFn: (newPassword: string) =>
      apiFetch("/account/change-password", {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      }),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = {
      password: validatePassword(password),
      passwordConfirmation: validatePasswordConfirmation(
        password,
        passwordConfirmation,
      ),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    changePassword.mutate(password);
  };

  return (
    <>
      <MobileSidebar role={data.role} />
      <div className="flex bg-pink-200">
        <Sidebar role={data.role} />
        <main className="w-full h-screen overflow-y-scroll">
          <section className="bg-pink-300 mb-14 sm:mb-0">
            <h2 className="text-center font-bold py-2 border-b border-pink-500">
              Merelaagri gossip
            </h2>
            <div className="mx-4 pb-2">
              <div>
                <span>Kasutajanimi: </span>
                <span>{data.username}</span>
              </div>
              <div className="mt-2">
                <p>Muuda salasõna</p>
                <form onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="password">Uus salasõna</label>

                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="w-full p-2 rounded-xl my-2 bg-white"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />

                    <div className="text-xs font-semibold text-center tracking-wide text-red-500 w-full">
                      {errors.password || ""}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password-confirmation">
                      Salasõna kinnitus
                    </label>

                    <input
                      type="password"
                      id="password-confirmation"
                      name="password-confirmation"
                      className="w-full p-2 rounded-xl my-2 bg-white"
                      required
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                    />

                    <div className="text-xs font-semibold text-center tracking-wide text-red-500 w-full">
                      {errors.passwordConfirmation || ""}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={changePassword.isPending}
                    className="bg-pink-400 px-4 py-2 rounded"
                  >
                    Muuda
                  </button>
                </form>
                {changePassword.isError ? (
                  <span className="text-red-500">
                    {changePassword.error instanceof ApiError
                      ? changePassword.error.message
                      : "Serveri viga."}
                  </span>
                ) : null}
                {changePassword.isSuccess ? (
                  <span>Salasõna edukalt muudetud!</span>
                ) : null}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
