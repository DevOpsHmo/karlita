import { jwtVerify } from "jose";

export async function hasValidSession(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-zona-x"));
    return true;
  } catch {
    return false;
  }
}
