import { NextRequest, NextResponse } from "next/server";
import { ensureSchoolShareToken } from "@/lib/store";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const school = await ensureSchoolShareToken(id);
  if (!school?.shareToken) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ path: `/r/escuela/${school.shareToken}` });
}
