import { NextRequest, NextResponse } from "next/server";
import { folderYesPercent, type FolderPayload } from "@/lib/folder-form";
import { visitYesPercent, type VisitPayload } from "@/lib/visit-form";
import { computeItemStats } from "@/lib/item-stats";
import { ackStatus, getAcknowledgment, getTeacherByToken, listClassVisits, listFolderReviews } from "@/lib/store";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const teacher = await getTeacherByToken(token);
  if (!teacher) return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  const [folders, visits, ack] = await Promise.all([
    listFolderReviews({ teacherId: teacher.id }),
    listClassVisits({ teacherId: teacher.id }),
    getAcknowledgment(teacher.id),
  ]);
  const lastFolder = folders[0];
  const lastVisit = visits[0];
  const folderPayload = lastFolder ? (JSON.parse(lastFolder.payload) as FolderPayload) : null;
  const visitPayload = lastVisit ? (JSON.parse(lastVisit.payload) as VisitPayload) : null;
  return NextResponse.json({
    teacher: {
      name: teacher.name,
      disciplina: teacher.disciplina,
      turno: teacher.turno,
      school: teacher.school,
    },
    folder: lastFolder
      ? {
          id: lastFolder.id,
          date: lastFolder.createdAt,
          pct: folderPayload ? folderYesPercent(folderPayload).pct : 0,
          observaciones: folderPayload?.observacionesGenerales ?? "",
        }
      : null,
    visit: lastVisit
      ? {
          id: lastVisit.id,
          date: lastVisit.createdAt,
          pct: visitPayload ? visitYesPercent(visitPayload).pct : 0,
          observaciones: visitPayload?.observacionesGenerales ?? "",
        }
      : null,
    ack,
    status: ackStatus(ack, lastFolder?.createdAt, lastVisit?.createdAt),
    itemStats: await computeItemStats({ teacherId: teacher.id }),
  });
}
