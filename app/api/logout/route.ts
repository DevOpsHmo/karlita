import { NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/supabase/route";

export async function POST() {
  const sb = await supabaseRoute();
  await sb.auth.signOut();
  return NextResponse.json({ ok: true });
}
