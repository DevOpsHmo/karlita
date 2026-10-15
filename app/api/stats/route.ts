import { NextResponse } from "next/server";
import { folderYesPercent, type FolderPayload } from "@/lib/folder-form";
import { visitYesPercent, type VisitPayload } from "@/lib/visit-form";
import { listClassVisits, listFolderReviews, listSchools, listTeachers } from "@/lib/store";

export async function GET() {
  const [schools, teachers, folders, visits] = await Promise.all([
    listSchools(),
    listTeachers(),
    listFolderReviews(),
    listClassVisits(),
  ]);

  const bySchool = schools.map((school) => {
    const schoolTeachers = teachers.filter((t) => t.schoolId === school.id);
    const folderPercents: number[] = [];
    const visitPercents: number[] = [];
    const quality: Record<string, number> = { Excelente: 0, Bueno: 0, Regular: 0, Malo: 0 };
    const ids = new Set(schoolTeachers.map((t) => t.id));
    const folderTeacherIds = new Set<string>();
    const visitTeacherIds = new Set<string>();
    for (const r of folders.filter((x) => ids.has(x.teacherId))) {
      folderTeacherIds.add(r.teacherId);
      try {
        folderPercents.push(folderYesPercent(JSON.parse(r.payload) as FolderPayload).pct);
      } catch {
        /* ignore */
      }
    }
    for (const v of visits.filter((x) => ids.has(x.teacherId))) {
      visitTeacherIds.add(v.teacherId);
      try {
        const p = JSON.parse(v.payload) as VisitPayload;
        visitPercents.push(visitYesPercent(p).pct);
        if (p.salud && quality[p.salud] !== undefined) quality[p.salud] += 1;
        if (p.infraestructura && quality[p.infraestructura] !== undefined) quality[p.infraestructura] += 1;
      } catch {
        /* ignore */
      }
    }
    const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
    return {
      id: school.id,
      name: school.name,
      shortName: school.shortName,
      cct: school.cct,
      teachers: schoolTeachers.length,
      folderReviews: folderPercents.length,
      classVisits: visitPercents.length,
      folderTeachers: folderTeacherIds.size,
      visitTeachers: visitTeacherIds.size,
      folderPct: avg(folderPercents),
      visitPct: avg(visitPercents),
      quality,
    };
  });

  const withFolders = bySchool.filter((s) => s.folderReviews);
  const withVisits = bySchool.filter((s) => s.classVisits);
  const zona = {
    teachers: bySchool.reduce((a, s) => a + s.teachers, 0),
    folderReviews: bySchool.reduce((a, s) => a + s.folderReviews, 0),
    classVisits: bySchool.reduce((a, s) => a + s.classVisits, 0),
    folderTeachers: bySchool.reduce((a, s) => a + s.folderTeachers, 0),
    visitTeachers: bySchool.reduce((a, s) => a + s.visitTeachers, 0),
    folderPct: withFolders.length
      ? Math.round(withFolders.reduce((a, s) => a + s.folderPct, 0) / withFolders.length)
      : 0,
    visitPct: withVisits.length ? Math.round(withVisits.reduce((a, s) => a + s.visitPct, 0) / withVisits.length) : 0,
  };

  return NextResponse.json({ schools: bySchool, zona });
}
