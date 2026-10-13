export function publicOrigin() {
  const configured = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window === "undefined") return "";
  const { origin, hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return origin;
  return origin;
}

export function publicUrl(path: string) {
  const origin = publicOrigin() || (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin}${path}`;
}
