import { NextRequest, NextResponse } from "next/server";
import { isSupervision } from "@/lib/roles";
import { revokeTeacherShare } from "@/lib/store";
import { currentUser } from "@/lib/supabase/route";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!isSupervision(user?.email)) {
    return NextResponse.json({ error: "Solo supervisión puede revocar enlaces" }, { status: 403 });
  }
  const { id } = await params;
  const teacher = await revokeTeacherShare(id, user?.email);
  if (!teacher) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
