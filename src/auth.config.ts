import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/user/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnAdminPage = nextUrl.pathname.startsWith("/dashboard") ||
                nextUrl.pathname.startsWith("/moderation") ||
                nextUrl.pathname.startsWith("/interest/manage") ||
                nextUrl.pathname.startsWith("/feedback") ||
                nextUrl.pathname.startsWith("/user-management");
            const isOnUserPage = nextUrl.pathname.startsWith("/user") ||
                nextUrl.pathname.startsWith("/interest/");
            const isLoginPage = nextUrl.pathname.startsWith("/user/login");

            if (isOnAdminPage) {
                // Admin only
                if (isLoggedIn && auth.user.role === "ADMIN") return true;
                return false; // Redirect unauthenticated users to login page
            }

            if (isOnUserPage && !isLoginPage) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
                session.user.role = token.role as any;
            }
            return session;
        },
    },
    providers: [], // Add providers with an empty array for now
    trustHost: true,
} satisfies NextAuthConfig;
