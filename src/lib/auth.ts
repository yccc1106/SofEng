import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { Adapter } from "next-auth/adapters";
import { authConfig } from "../auth.config";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    trustHost: true,
    adapter: PrismaAdapter(prisma) as unknown as Adapter,
    callbacks: {
        ...authConfig.callbacks,
        async jwt(params) {
            const token = await authConfig.callbacks.jwt(params);
            if (!token?.id) return token;
            const current = await prisma.user.findUnique({
                where: { id: token.id as string },
                select: { role: true, status: true },
            });
            if (!current || current.status !== 'ACTIVE') return null;
            token.role = current.role;
            return token;
        },
    },
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email as string,
                    },
                });

                if (!user || !user.password || user.status !== "ACTIVE") {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role,
                };
            },
        }),
    ],

    session: {
        strategy: "jwt",
    },
});
