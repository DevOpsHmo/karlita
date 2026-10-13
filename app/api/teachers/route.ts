import { NextRequest, NextResponse } from "next/server";
import { createTeacher, listTeachers } from "@/lib/store";

export async function GET(request: NextRequest) {
  const schoolId = request.nextUrl.searchParams.get("schoolId");
  return NextResponse.json(await listTeachers(schoolId));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const teacher = await createTeacher({
    name: String(body.name ?? "").trim(),
    disciplina: String(body.disciplina ?? "").trim(),
    turno: String(body.turno ?? "Matutino"),
    schoolId: String(body.schoolId),
  });
  return NextResponse.json(teacher);
}
