import { NextRequest, NextResponse } from "next/server";
import { schoolReport } from "@/lib/reports";
import { getSchoolByToken } from "@/lib/store";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const school = await getSchoolByToken(token);
  if (!school) return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  return NextResponse.json(await schoolReport(school));
}
