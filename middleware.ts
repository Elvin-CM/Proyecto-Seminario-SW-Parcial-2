import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const isLoggedIn = !!req.auth;

    const protectedRoutes = ["/checkout", "/orders"];
    const authRoutes = ["/auth/login", "/auth/register"];

    if (authRoutes.includes(pathname) && isLoggedIn) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    if (protectedRoutes.some(r => pathname.startsWith(r)) && !isLoggedIn) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
    }
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};