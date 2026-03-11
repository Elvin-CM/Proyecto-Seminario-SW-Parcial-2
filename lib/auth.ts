import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { AdapterAccount } from "@auth/core/adapters";
import { cookies } from "next/headers";

function sanitizeAccountForPrisma(data: AdapterAccount): AdapterAccount {
    // Our Prisma schema does not include all optional OAuth fields that Auth.js may provide.
    // If we pass unknown keys to Prisma, it can throw (e.g. token_type, scope, id_token, session_state).
    const { userId, type, provider, providerAccountId, access_token, refresh_token, expires_at } = data;
    return { userId, type, provider, providerAccountId, access_token, refresh_token, expires_at };
}

const baseAdapter = PrismaAdapter(prisma);
const baseLinkAccount = baseAdapter.linkAccount?.bind(baseAdapter);

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: {
        ...baseAdapter,
        linkAccount: (data) => {
            if (!baseLinkAccount) {
                throw new Error("Adapter misconfigured: linkAccount is missing");
            }
            return baseLinkAccount(sanitizeAccountForPrisma(data));
        },
    },
    session: { strategy: "jwt" },
    pages: { signIn: "/auth/login" },
    providers: [
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                Google({
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    // Allow signing in with Google when a credentials user with the same email already exists.
                    // This links the OAuth account to the existing user by email.
                    allowDangerousEmailAccountLinking: true,
                }),
            ]
            : []),
        Credentials({
            credentials: {
                email: { type: "email" },
                password: { type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!user?.password) return null;

                const valid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                return valid ? { id: user.id, email: user.email, name: user.name } : null;
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider !== "google") return true;

            const cookieStore = await cookies();
            const intent = cookieStore.get("auth_intent")?.value;

            if (intent !== "register") return true;

            // limpiar cookie
            cookieStore.set("auth_intent", "", { path: "/", maxAge: 0 });

            if (user.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                    select: { id: true },
                });

                if (existingUser) {
                    return "/auth/register?error=exists";
                }
            }

            return true;
        },

        jwt({ token, user }) {
            if (user) token.id = user.id;
            return token;
        },

        session({ session, token }) {
            if (session.user) session.user.id = token.id as string;
            return session;
        },
    }
});
