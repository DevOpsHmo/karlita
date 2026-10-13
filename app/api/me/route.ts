import { NextResponse } from "next/server";
import { roleFromEmail } from "@/lib/roles";
import { currentUser } from "@/lib/supabase/route";

export async function GET() {
  const user = await currentUser();
  if (!user?.email) return NextResponse.json({ email: "", role: "atp" });
  return NextResponse.json({ email: user.email, role: roleFromEmail(user.email) });
}
