"use server";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LoginSchema, RegisterSchema } from "@/lib/validations";

export async function login(formData: FormData): Promise<void> {
  const data = Object.fromEntries(formData);
  const result = LoginSchema.safeParse(data);

  if (!result.success) {
    redirect("/auth/login?error=missing");
  }

  const { email, password } = result.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/auth/login?error=invalid");
    }
    throw error;
  }
  redirect("/");
}

export async function register(formData: FormData): Promise<void> {
  const data = Object.fromEntries(formData);
  const result = RegisterSchema.safeParse(data);

  if (!result.success) {
    const errorType = result.error.issues[0].path[0] === "email" ? "email" : 
                    result.error.issues[0].path[0] === "password" ? "password" : "missing";
    redirect(`/auth/register?error=${errorType}`);
  }

  const { name, email, password } = result.data;

  const exists = await prisma.user.findUnique({ where: { email } });

  if (exists) {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@prototypestore.com";
    if (exists.role !== "ADMIN" && email === adminEmail) {
      await prisma.user.update({
        where: { email },
        data: { 
          role: "ADMIN", 
          password: await bcrypt.hash(password, 10), 
          name 
        },
      });
      redirect("/auth/login?success=registered");
      return;
    }

    redirect("/auth/register?error=exists");
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@prototypestore.com";
  const role = email.toLowerCase() === adminEmail.toLowerCase() ? "ADMIN" : "CUSTOMER";

  await prisma.user.create({
    data: {
      email,
      name,
      password: await bcrypt.hash(password, 10),
      role,
    },
  });

  redirect("/auth/login?success=registered");
}

export async function loginWithGoogle(): Promise<void> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    redirect("/auth/login?error=google_not_configured");
  }
  await signIn("google", { redirectTo: "/" });
}

export async function registerWithGoogle(): Promise<void> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    redirect("/auth/register?error=google_not_configured");
  }

  const cookieStore = await cookies();
  cookieStore.set("auth_intent", "register", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 5 * 60,
  });

  await signIn("google", { redirectTo: "/" });
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
