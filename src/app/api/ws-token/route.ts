import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import * as jose from "jose";

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore - token is added in auth.config.ts
    const tokenData = session.token;

    if (!tokenData || !tokenData.id) {
        return NextResponse.json({ error: "No token data found" }, { status: 401 });
    }

    // 使用与 Go 服务器相同的 secret（JWT_SECRET）
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
        return NextResponse.json({ error: "JWT_SECRET not configured" }, { status: 500 });
    }

    // Create JWT using the same secret as the Go server expects
    const jwt = await new jose.SignJWT({
        id: tokenData.id,
        email: session.user.email,
        name: session.user.name,
        role: tokenData.role,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(new TextEncoder().encode(secret));

    return NextResponse.json({ token: jwt });
}