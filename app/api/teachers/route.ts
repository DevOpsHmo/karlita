import { NextRequest, NextResponse } from "next/server";
import { createTeacher, listTeachers } from "@/lib/store";
import { currentUser } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const schoolId = request.nextUrl.searchParams.get("schoolId");
  return NextResponse.json(await listTeachers(schoolId));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await currentUser();
  const teacher = await createTeacher({
    name: String(body.name ?? "").trim(),
    disciplina: String(body.disciplina ?? "").trim(),
    turno: String(body.turno ?? "Matutino"),
    schoolId: String(body.schoolId),
    actor: user?.email,
  });
  return NextResponse.json(teacher);
}
