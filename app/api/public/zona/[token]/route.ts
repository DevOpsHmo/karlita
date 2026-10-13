import { NextRequest, NextResponse } from "next/server";
import { zonaReport } from "@/lib/reports";
import { getZonaByToken } from "@/lib/store";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await getZonaByToken(token))) return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  return NextResponse.json(await zonaReport());
}
