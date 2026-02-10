import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = process.env.JWT_SECRET || "philmong-secret-key-1234567890";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ["HS256"],
    });

    return payload;
}

export async function login(username: string, name: string = "User") {
    const user = { username, name };

    // Create the session
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const session = await encrypt({ user, expires });

    // Save the session in a cookie
    const cookieStore = await cookies();
    cookieStore.set("session", session, {
        expires,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
    });
}

export async function logout() {
    // Destroy the session
    (await cookies()).set("session", "", { expires: new Date(0) });
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    try {
        return await decrypt(session);
    } catch (e) {
        return null;
    }
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    if (!session) return;

    try {
        // Refresh the session so it doesn't expire
        const parsed = await decrypt(session);
        parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const res = NextResponse.next();
        res.cookies.set({
            name: "session",
            value: await encrypt(parsed),
            httpOnly: true,
            expires: parsed.expires,
        });
        return res;
    } catch (e) {
        return;
    }
}
