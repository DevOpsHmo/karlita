import { NextResponse } from "next/server";
import { visitPeriodFromDate } from "@/lib/periods";
import { ackStatus, listAcknowledgments, listClassVisits, listFolderReviews, listSchools, listTeachers } from "@/lib/store";
import type { VisitPayload } from "@/lib/visit-form";

export async function GET() {
  const [schools, teachers, visits, folders, acks] = await Promise.all([
    listSchools(),
    listTeachers(),
    listClassVisits(),
    listFolderReviews(),
    listAcknowledgments(),
  ]);
  const ackBy = Object.fromEntries(acks.map((a) => [a.teacherId, a]));
  const alerts: { level: "warn" | "info"; text: string }[] = [];
  for (const school of schools) {
    const ids = new Set(teachers.filter((t) => t.schoolId === school.id).map((t) => t.id));
    for (const p of ["1", "2", "3"] as const) {
      const has = visits.some((v) => {
        if (!ids.has(v.teacherId)) return false;
        try {
          const payload = JSON.parse(v.payload) as VisitPayload;
          return visitPeriodFromDate(payload.fecha) === p;
        } catch {
          return false;
        }
      });
      if (!has) alerts.push({ level: "warn", text: `${school.shortName} no tiene visitas del periodo ${p}.` });
    }
  }
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
