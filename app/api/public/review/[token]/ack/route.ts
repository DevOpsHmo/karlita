import { NextRequest, NextResponse } from "next/server";
import { folderYesPercent, type FolderPayload } from "@/lib/folder-form";
import { visitYesPercent, type VisitPayload } from "@/lib/visit-form";
import { getTeacherByToken, listClassVisits, listFolderReviews, saveAcknowledgment } from "@/lib/store";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const teacher = await getTeacherByToken(token);
  if (!teacher) return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  const body = await request.json();
  const agreed = body.agreed === true || body.agreed === "si";
  const nombreFirma = String(body.nombreFirma ?? "").trim() || teacher.name;
  const firmaDataUrl = String(body.firmaDataUrl ?? "");
  const comentario = String(body.comentario ?? "").trim();
  if (!firmaDataUrl.startsWith("data:image")) {
    return NextResponse.json({ error: "Firme en el recuadro." }, { status: 400 });
  }
  if (!agreed && !comentario) {
    return NextResponse.json({ error: "Si no está de acuerdo, indique el motivo." }, { status: 400 });
  }
  const [folders, visits] = await Promise.all([
    listFolderReviews({ teacherId: teacher.id }),
    listClassVisits({ teacherId: teacher.id }),
  ]);
  const lastFolder = folders[0];
  const lastVisit = visits[0];
  const ack = await saveAcknowledgment({
    teacherId: teacher.id,
    agreed,
    nombreFirma,
    firmaDataUrl,
    comentario,
    signedAt: new Date().toISOString(),
    folderId: lastFolder?.id,
    visitId: lastVisit?.id,
    folderPct: lastFolder ? folderYesPercent(JSON.parse(lastFolder.payload) as FolderPayload).pct : undefined,
    visitPct: lastVisit ? visitYesPercent(JSON.parse(lastVisit.payload) as VisitPayload).pct : undefined,
  });
  return NextResponse.json({ ok: true, ack });
}
