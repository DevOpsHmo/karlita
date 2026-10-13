import { NextRequest, NextResponse } from "next/server";
import { getFolderReview, saveFolderReview } from "@/lib/store";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getFolderReview(id);
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const current = await getFolderReview(id);
  if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const row = await saveFolderReview(String(body.teacherId ?? current.teacherId), body.payload ?? {}, id);
  return NextResponse.json(row);
}
