import { type LoaderFunctionArgs, redirect } from "react-router";

import { requireUser } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireUser(request);
  return redirect("/posts");
};

export default function Home() {
  return <h2>Home Page</h2>;
}
