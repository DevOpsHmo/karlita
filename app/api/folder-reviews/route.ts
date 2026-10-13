import { NextRequest, NextResponse } from "next/server";
import { listFolderReviews, saveFolderReview } from "@/lib/store";

export async function GET(request: NextRequest) {
  const teacherId = request.nextUrl.searchParams.get("teacherId");
  const schoolId = request.nextUrl.searchParams.get("schoolId");
  return NextResponse.json(await listFolderReviews({ teacherId, schoolId }));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const row = await saveFolderReview(String(body.teacherId), body.payload ?? {});
  return NextResponse.json(row);
}
