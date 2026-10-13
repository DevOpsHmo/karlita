import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "zona_x_session";

function secret() {
  return new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-zona-x");
}

export async function createSession() {
  const token = await new SignJWT({ ok: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function isLoggedIn() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

export function checkPassword(password: string) {
  const expected = process.env.APP_PASSWORD || "zona-x-2026";
  return password === expected;
}
