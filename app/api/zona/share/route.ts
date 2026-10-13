import { NextResponse } from "next/server";
import { ensureZonaShareToken } from "@/lib/store";

export async function POST() {
  const token = await ensureZonaShareToken();
  return NextResponse.json({ path: `/r/zona/${token}` });
}
