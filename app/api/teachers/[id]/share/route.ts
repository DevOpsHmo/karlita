import { NextRequest, NextResponse } from "next/server";
import { ensureShareToken } from "@/lib/store";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teacher = await ensureShareToken(id);
  if (!teacher) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({
    token: teacher.shareToken,
    teacherId: teacher.id,
    path: `/r/maestro/${teacher.shareToken}`,
  });
}
