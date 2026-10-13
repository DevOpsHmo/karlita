export type AppRole = "supervision" | "atp";

export function roleFromEmail(email?: string | null): AppRole {
  const e = (email ?? "").toLowerCase();
  if (e.startsWith("supervision@")) return "supervision";
  return "atp";
}

export function isSupervision(email?: string | null) {
  return roleFromEmail(email) === "supervision";
}
