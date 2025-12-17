import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/user/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard") ||
                nextUrl.pathname.startsWith("/moderation") ||
                nextUrl.pathname.startsWith("/interest") ||
                nextUrl.pathname.startsWith("/feedback");
            const isOnUserPage = nextUrl.pathname.startsWith("/user");
            const isLoginPage = nextUrl.pathname.startsWith("/user/login");

            if (isOnDashboard) {
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
    },
    providers: [], // Add providers with an empty array for now
    trustHost: true,
} satisfies NextAuthConfig;
