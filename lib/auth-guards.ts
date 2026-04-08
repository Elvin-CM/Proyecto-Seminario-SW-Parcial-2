import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  return session;
}

export async function requireAdminUser() {
  const session = await requireAuthenticatedUser();

  if (session.user.role !== "ADMIN") {
    throw new Error("No autorizado");
  }

  return session;
}
