import { SCHOOLS } from "./schools";
import { supabaseAdmin } from "./supabase/admin";

const BUCKET = "zona-x-data";

export type School = { id: string; name: string; shortName: string; cct: string; shareToken?: string };
export type Teacher = {
  id: string;
  name: string;
  disciplina: string;
  turno: string;
  schoolId: string;
  createdAt: string;
  shareToken?: string;
  school?: School;
};

export type Acknowledgment = {
  teacherId: string;
  agreed: boolean;
  nombreFirma: string;
  firmaDataUrl: string;
  comentario: string;
  signedAt: string;
  folderId?: string;
  visitId?: string;
  folderPct?: number;
  visitPct?: number;
};
export type RecordRow = {
  id: string;
  teacherId: string;
  payload: string;
  createdAt: string;
  updatedAt: string;
  teacher?: Teacher;
};

async function put(path: string, data: unknown) {
  const sb = supabaseAdmin();
  const body = JSON.stringify(data);
  const { error } = await sb.storage.from(BUCKET).upload(path, body, {
    upsert: true,
    contentType: "application/json",
  });
  if (error) throw error;
}

async function get<T>(path: string): Promise<T | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return JSON.parse(await data.text()) as T;
}

async function remove(path: string) {
  const sb = supabaseAdmin();
  await sb.storage.from(BUCKET).remove([path]);
}

async function listJson<T>(prefix: string): Promise<T[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error || !data) return [];
  const files = data.filter((f) => f.name.endsWith(".json"));
  const rows: T[] = [];
  for (const f of files) {
    const row = await get<T>(`${prefix}/${f.name}`);
    if (row) rows.push(row);
  }
  return rows;
}

export async function ensureSchools(): Promise<School[]> {
  const existing = await listJson<School>("schools");
  if (existing.length) return existing.sort((a, b) => a.shortName.localeCompare(b.shortName));
  const created: School[] = SCHOOLS.map((s) => ({
    id: crypto.randomUUID(),
    name: s.name,
    shortName: s.shortName,
    cct: s.cct,
  }));
  for (const s of created) await put(`schools/${s.id}.json`, s);
  return created.sort((a, b) => a.shortName.localeCompare(b.shortName));
}

export async function listSchools() {
  return ensureSchools();
}

async function withSchool(teacher: Teacher): Promise<Teacher> {
  const schools = await ensureSchools();
  return { ...teacher, school: schools.find((s) => s.id === teacher.schoolId) };
}

export async function listTeachers(schoolId?: string | null) {
  let teachers = await listJson<Teacher>("teachers");
  if (schoolId) teachers = teachers.filter((t) => t.schoolId === schoolId);
  teachers.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return Promise.all(teachers.map(withSchool));
}

export async function getTeacher(id: string) {
  const t = await get<Teacher>(`teachers/${id}.json`);
  if (!t) return null;
  return withSchool(t);
}

export async function createTeacher(input: { name: string; disciplina: string; turno: string; schoolId: string }) {
  const teacher: Teacher = {
    id: crypto.randomUUID(),
    name: input.name,
    disciplina: input.disciplina,
    turno: input.turno,
    schoolId: input.schoolId,
    createdAt: new Date().toISOString(),
    shareToken: crypto.randomUUID(),
  };
  await put(`teachers/${teacher.id}.json`, teacher);
  return withSchool(teacher);
}

export async function updateTeacher(
  id: string,
  patch: Partial<Pick<Teacher, "name" | "disciplina" | "turno" | "schoolId">>
) {
  const current = await get<Teacher>(`teachers/${id}.json`);
  if (!current) return null;
  const next = {
    ...current,
    ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)),
  };
  await put(`teachers/${id}.json`, next);
  return withSchool(next);
}

export async function deleteTeacher(id: string) {
  const folders = await listFolderReviews();
  const visits = await listClassVisits();
  for (const r of folders.filter((x) => x.teacherId === id)) await remove(`folder-reviews/${r.id}.json`);
  for (const r of visits.filter((x) => x.teacherId === id)) await remove(`class-visits/${r.id}.json`);
  await remove(`teachers/${id}.json`);
}

async function withTeacher(row: RecordRow): Promise<RecordRow> {
  const teacher = await getTeacher(row.teacherId);
  return { ...row, teacher: teacher ?? undefined };
}

export async function listFolderReviews(opts?: { teacherId?: string | null; schoolId?: string | null }) {
  let rows = await listJson<RecordRow>("folder-reviews");
  if (opts?.teacherId) rows = rows.filter((r) => r.teacherId === opts.teacherId);
  const withT = await Promise.all(rows.map(withTeacher));
  let out = withT;
  if (opts?.schoolId) out = out.filter((r) => r.teacher?.schoolId === opts.schoolId);
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getFolderReview(id: string) {
  const row = await get<RecordRow>(`folder-reviews/${id}.json`);
  if (!row) return null;
  return withTeacher(row);
}

export async function saveFolderReview(teacherId: string, payload: unknown, id?: string) {
  const now = new Date().toISOString();
  const existing = id ? await get<RecordRow>(`folder-reviews/${id}.json`) : null;
  const row: RecordRow = {
    id: existing?.id ?? crypto.randomUUID(),
    teacherId,
    payload: JSON.stringify(payload ?? {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await put(`folder-reviews/${row.id}.json`, row);
  return withTeacher(row);
}

export async function listClassVisits(opts?: { teacherId?: string | null; schoolId?: string | null }) {
  let rows = await listJson<RecordRow>("class-visits");
  if (opts?.teacherId) rows = rows.filter((r) => r.teacherId === opts.teacherId);
  const withT = await Promise.all(rows.map(withTeacher));
  let out = withT;
  if (opts?.schoolId) out = out.filter((r) => r.teacher?.schoolId === opts.schoolId);
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getClassVisit(id: string) {
  const row = await get<RecordRow>(`class-visits/${id}.json`);
  if (!row) return null;
  return withTeacher(row);
}

export async function saveClassVisit(teacherId: string, payload: unknown, id?: string) {
  const now = new Date().toISOString();
  const existing = id ? await get<RecordRow>(`class-visits/${id}.json`) : null;
  const row: RecordRow = {
    id: existing?.id ?? crypto.randomUUID(),
    teacherId,
    payload: JSON.stringify(payload ?? {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await put(`class-visits/${row.id}.json`, row);
  return withTeacher(row);
}

export type Draft = {
  schoolId: string;
  teacherId: string;
  payload: unknown;
  updatedAt: string;
};

export async function getDraft(userId: string, kind: string) {
  return get<Draft>(`drafts/${userId}/${kind}.json`);
}

export async function saveDraft(userId: string, kind: string, draft: Omit<Draft, "updatedAt">) {
  const row: Draft = { ...draft, updatedAt: new Date().toISOString() };
  await put(`drafts/${userId}/${kind}.json`, row);
  return row;
}

export async function deleteDraft(userId: string, kind: string) {
  await remove(`drafts/${userId}/${kind}.json`);
}

export async function ensureShareToken(teacherId: string) {
  const t = await get<Teacher>(`teachers/${teacherId}.json`);
  if (!t) return null;
  if (t.shareToken) return withSchool(t);
  t.shareToken = crypto.randomUUID();
  await put(`teachers/${t.id}.json`, t);
  return withSchool(t);
}

export async function getTeacherByToken(token: string) {
  const teachers = await listJson<Teacher>("teachers");
  const t = teachers.find((x) => x.shareToken === token);
  if (!t) return null;
  return withSchool(t);
}

export async function getAcknowledgment(teacherId: string) {
  return get<Acknowledgment>(`acknowledgments/${teacherId}.json`);
}

export async function listAcknowledgments() {
  return listJson<Acknowledgment>("acknowledgments");
}

export async function saveAcknowledgment(ack: Acknowledgment) {
  await put(`acknowledgments/${ack.teacherId}.json`, ack);
  return ack;
}

export function ackStatus(
  ack: Acknowledgment | null,
  latestFolderAt?: string,
  latestVisitAt?: string
): "pendiente" | "de_acuerdo" | "en_desacuerdo" | "nueva_revision" {
  if (!ack) return "pendiente";
  const signed = Date.parse(ack.signedAt);
  const later =
    (latestFolderAt && Date.parse(latestFolderAt) > signed + 1000) ||
    (latestVisitAt && Date.parse(latestVisitAt) > signed + 1000);
  if (later) return "nueva_revision";
  return ack.agreed ? "de_acuerdo" : "en_desacuerdo";
}

export async function getSchool(id: string) {
  const schools = await ensureSchools();
  return schools.find((s) => s.id === id) ?? null;
}

export async function ensureSchoolShareToken(id: string) {
  const s = await get<School>(`schools/${id}.json`);
  if (!s) return null;
  if (!s.shareToken) {
    s.shareToken = crypto.randomUUID();
    await put(`schools/${id}.json`, s);
  }
  return s;
}

export async function getSchoolByToken(token: string) {
  const schools = await ensureSchools();
  return schools.find((s) => s.shareToken === token) ?? null;
}

export async function ensureZonaShareToken() {
  const current = await get<{ shareToken: string }>("meta/zona.json");
  if (current?.shareToken) return current.shareToken;
  const shareToken = crypto.randomUUID();
  await put("meta/zona.json", { shareToken });
  return shareToken;
}

export async function getZonaByToken(token: string) {
  const current = await get<{ shareToken: string }>("meta/zona.json");
  return current?.shareToken === token;
}
