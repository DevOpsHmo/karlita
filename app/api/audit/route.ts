import { NextResponse } from "next/server";
import { listAudit } from "@/lib/store";

export async function GET() {
  return NextResponse.json(await listAudit());
}
