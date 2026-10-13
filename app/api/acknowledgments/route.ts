import { NextResponse } from "next/server";
import { ackStatus, listAcknowledgments, listClassVisits, listFolderReviews, listTeachers } from "@/lib/store";

export async function GET() {
  const [acks, teachers, folders, visits] = await Promise.all([
    listAcknowledgments(),
    listTeachers(),
    listFolderReviews(),
    listClassVisits(),
  ]);
  const byTeacher = Object.fromEntries(acks.map((a) => [a.teacherId, a]));
  const rows = teachers.map((t) => {
    const lastF = folders.find((f) => f.teacherId === t.id);
    const lastV = visits.find((v) => v.teacherId === t.id);
    const ack = byTeacher[t.id] ?? null;
    return {
      teacherId: t.id,
      name: t.name,
      school: t.school?.shortName,
      status: ackStatus(ack, lastF?.createdAt, lastV?.createdAt),
      ack,
    };
  });
  return NextResponse.json(rows);
}
