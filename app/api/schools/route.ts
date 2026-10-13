import { NextResponse } from "next/server";
import { listSchools } from "@/lib/store";

export async function GET() {
  return NextResponse.json(await listSchools());
}
