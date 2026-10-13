import { folderYesPercent, type FolderPayload } from "./folder-form";
import { visitYesPercent, type VisitPayload } from "./visit-form";
import { listClassVisits, listFolderReviews, listSchools, listTeachers, type School } from "./store";

const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);

export async function schoolReport(school: School) {
  const [teachers, folders, visits] = await Promise.all([
    listTeachers(school.id),
    listFolderReviews({ schoolId: school.id }),
    listClassVisits({ schoolId: school.id }),
  ]);
  const rows = teachers.map((t) => {
    const tf = folders.filter((f) => f.teacherId === t.id);
    const tv = visits.filter((v) => v.teacherId === t.id);
    const fp = avg(tf.map((r) => folderYesPercent(JSON.parse(r.payload) as FolderPayload).pct));
    const vp = avg(tv.map((r) => visitYesPercent(JSON.parse(r.payload) as VisitPayload).pct));
    return {
      name: t.name,
      disciplina: t.disciplina,
      folderPct: fp,
      visitPct: vp,
      folders: tf.length,
      visits: tv.length,
    };
  });
  return {
    school,
    teachers: rows,
    folderPct: avg(rows.filter((r) => r.folders).map((r) => r.folderPct)),
    visitPct: avg(rows.filter((r) => r.visits).map((r) => r.visitPct)),
  };
}

export async function zonaReport() {
  const schools = await listSchools();
  const reports = await Promise.all(schools.map(schoolReport));
  const withF = reports.filter((r) => r.teachers.some((t) => t.folders));
  const withV = reports.filter((r) => r.teachers.some((t) => t.visits));
  return {
    schools: reports.map((r) => ({
      id: r.school.id,
      name: r.school.name,
      shortName: r.school.shortName,
      cct: r.school.cct,
      teachers: r.teachers.length,
      folderPct: r.folderPct,
      visitPct: r.visitPct,
    })),
    zona: {
      teachers: reports.reduce((a, r) => a + r.teachers.length, 0),
      folderPct: withF.length ? Math.round(withF.reduce((a, r) => a + r.folderPct, 0) / withF.length) : 0,
      visitPct: withV.length ? Math.round(withV.reduce((a, r) => a + r.visitPct, 0) / withV.length) : 0,
    },
  };
}
