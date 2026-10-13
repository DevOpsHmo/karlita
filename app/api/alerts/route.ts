import { NextResponse } from "next/server";
import { ackStatus, listAcknowledgments, listClassVisits, listFolderReviews, listTeachers } from "@/lib/store";

export async function GET() {
  const [teachers, visits, folders, acks] = await Promise.all([
    listTeachers(),
    listClassVisits(),
    listFolderReviews(),
    listAcknowledgments(),
  ]);
  const ackBy = Object.fromEntries(acks.map((a) => [a.teacherId, a]));
  const alerts: { level: "warn" | "info"; text: string }[] = [];
  const unsigned = teachers.filter((t) => {
    const lastF = folders.find((f) => f.teacherId === t.id);
    const lastV = visits.find((v) => v.teacherId === t.id);
    const st = ackStatus(ackBy[t.id] ?? null, lastF?.createdAt, lastV?.createdAt);
    return st === "pendiente" || st === "nueva_revision";
  });
  if (unsigned.length) {
    alerts.push({
      level: "info",
      text: `${unsigned.length} maestro${unsigned.length === 1 ? "" : "s"} sin firmar o con nueva revisión.`,
    });
  }
  return NextResponse.json({ alerts, unsigned: unsigned.map((t) => ({ id: t.id, name: t.name, school: t.school?.shortName })) });
}
