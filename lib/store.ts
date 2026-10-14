import { SCHOOLS } from "./schools";
import { supabaseAdmin } from "./supabase/admin";

const BUCKET = "zona-x-data";
const SHARE_DAYS = 90;

export type School = {
  id: string;
  name: string;
  shortName: string;
  cct: string;
  shareToken?: string;
  shareExpiresAt?: string;
  shareRevoked?: boolean;
};
export type Teacher = {
  id: string;
  name: string;
  disciplina: string;
  turno: string;
  schoolId: string;
  createdAt: string;
  shareToken?: string;
  shareExpiresAt?: string;
  shareRevoked?: boolean;
  school?: School;
  createdBy?: string;
  updatedBy?: string;
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
  createdBy?: string;
  updatedBy?: string;
  teacher?: Teacher;
};
export type AppSettings = {
  closedPeriods: ("1" | "2" | "3")[];
  updatedAt: string;
};
export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
};
export type Draft = {
  schoolId: string;
  teacherId: string;
  payload: unknown;
  updatedAt: string;
};

function sb() {
  return supabaseAdmin();
}

function iso(v?: string | null) {
  return v ?? undefined;
}

function mapSchool(r: Record<string, unknown>): School {
  return {
    id: String(r.id),
    name: String(r.name),
    shortName: String(r.short_name),
    cct: String(r.cct),
    shareToken: iso(r.share_token as string),
    shareExpiresAt: iso(r.share_expires_at as string),
    shareRevoked: Boolean(r.share_revoked),
  };
}

function mapTeacher(r: Record<string, unknown>, school?: School): Teacher {
  return {
    id: String(r.id),
    name: String(r.name),
    disciplina: String(r.disciplina ?? ""),
    turno: String(r.turno ?? ""),
    schoolId: String(r.school_id),
    createdAt: String(r.created_at),
    shareToken: iso(r.share_token as string),
    shareExpiresAt: iso(r.share_expires_at as string),
    shareRevoked: Boolean(r.share_revoked),
    createdBy: iso(r.created_by as string),
    school,
  };
}

function mapRecord(r: Record<string, unknown>): RecordRow {
  const payload = r.payload;
  return {
    id: String(r.id),
    teacherId: String(r.teacher_id),
    payload: typeof payload === "string" ? payload : JSON.stringify(payload ?? {}),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    createdBy: iso(r.created_by as string),
    updatedBy: iso(r.updated_by as string),
  };
}

function mapAck(r: Record<string, unknown>): Acknowledgment {
  return {
    teacherId: String(r.teacher_id),
    agreed: Boolean(r.agreed),
    nombreFirma: String(r.nombre_firma ?? ""),
    firmaDataUrl: String(r.firma_data_url ?? ""),
    comentario: String(r.comentario ?? ""),
    signedAt: String(r.signed_at ?? ""),
    folderId: iso(r.folder_id as string),
    visitId: iso(r.visit_id as string),
    folderPct: r.folder_pct == null ? undefined : Number(r.folder_pct),
    visitPct: r.visit_pct == null ? undefined : Number(r.visit_pct),
  };
}

async function putBackup(path: string, data: unknown) {
  const body = JSON.stringify(data);
  await sb().storage.from(BUCKET).upload(path, body, { upsert: true, contentType: "application/json" });
}

async function reassignTeacher(fromId: string, toId: string) {
  if (fromId === toId) return;
  await sb().from("folder_reviews").update({ teacher_id: toId }).eq("teacher_id", fromId);
  await sb().from("class_visits").update({ teacher_id: toId }).eq("teacher_id", fromId);
  await sb().from("drafts").delete().eq("teacher_id", fromId);
  const { data: keepAck } = await sb().from("acknowledgments").select("*").eq("teacher_id", toId).maybeSingle();
  const { data: fromAck } = await sb().from("acknowledgments").select("*").eq("teacher_id", fromId).maybeSingle();
  await sb().from("acknowledgments").delete().eq("teacher_id", fromId);
  if (fromAck && !keepAck) {
    const row = fromAck as Record<string, unknown>;
    await sb().from("acknowledgments").insert({ ...row, teacher_id: toId });
  }
  await sb().from("teachers").delete().eq("id", fromId);
}

function teacherKey(name: string, schoolId: string) {
  return `${schoolId}|${name.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

async function mergeDuplicateTeachers() {
  const { data } = await sb().from("teachers").select("*");
  const groups = new Map<string, { id: string; created_at: string }[]>();
  for (const r of data ?? []) {
    const key = teacherKey(String(r.name ?? ""), String(r.school_id ?? ""));
    const list = groups.get(key) ?? [];
    list.push({ id: String(r.id), created_at: String(r.created_at ?? "") });
    groups.set(key, list);
  }
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
    const keep = list[0];
    for (const dup of list.slice(1)) await reassignTeacher(dup.id, keep.id);
  }
}

export async function ensureSchools(): Promise<School[]> {
  const { data } = await sb().from("schools").select("*");
  let rows = (data ?? []).map((r) => mapSchool(r as Record<string, unknown>));
  if (!rows.length) {
    rows = SCHOOLS.map((s) => ({
      id: crypto.randomUUID(),
      name: s.name,
      shortName: s.shortName,
      cct: s.cct,
    }));
    await sb()
      .from("schools")
      .insert(
        rows.map((s) => ({
          id: s.id,
          name: s.name,
          short_name: s.shortName,
          cct: s.cct,
        }))
      );
    return rows.sort((a, b) => a.shortName.localeCompare(b.shortName, "es"));
  }

  const byCct = new Map<string, School[]>();
  for (const s of rows) {
    const k = s.cct.trim().toUpperCase();
    byCct.set(k, [...(byCct.get(k) ?? []), s]);
  }
  const unique: School[] = [];
  for (const group of byCct.values()) {
    const keep = group[0];
    unique.push(keep);
    for (const dup of group.slice(1)) {
      await sb().from("teachers").update({ school_id: keep.id }).eq("school_id", dup.id);
      await sb().from("schools").delete().eq("id", dup.id);
    }
  }
  await mergeDuplicateTeachers();
  return unique.sort((a, b) => a.shortName.localeCompare(b.shortName, "es"));
}

export async function listSchools() {
  return ensureSchools();
}

async function withSchool(teacher: Teacher): Promise<Teacher> {
  const schools = await ensureSchools();
  return { ...teacher, school: schools.find((s) => s.id === teacher.schoolId) };
}

export async function listTeachers(schoolId?: string | null) {
  let q = sb().from("teachers").select("*");
  if (schoolId) q = q.eq("school_id", schoolId);
  const { data } = await q;
  const teachers = (data ?? []).map((r) => mapTeacher(r as Record<string, unknown>));
  teachers.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return Promise.all(teachers.map(withSchool));
}

export async function getTeacher(id: string) {
  const { data } = await sb().from("teachers").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  return withSchool(mapTeacher(data as Record<string, unknown>));
}

export async function createTeacher(input: {
  name: string;
  disciplina: string;
  turno: string;
  schoolId: string;
  actor?: string;
}) {
  const name = input.name.trim();
  const existing = (await listTeachers(input.schoolId)).find(
    (t) => teacherKey(t.name, t.schoolId) === teacherKey(name, input.schoolId)
  );
  if (existing) return existing;
  const teacher: Teacher = {
    id: crypto.randomUUID(),
    name,
    disciplina: input.disciplina,
    turno: input.turno,
    schoolId: input.schoolId,
    createdAt: new Date().toISOString(),
    shareToken: crypto.randomUUID(),
    shareExpiresAt: new Date(Date.now() + SHARE_DAYS * 86400000).toISOString(),
    createdBy: input.actor,
  };
  const { error } = await sb().from("teachers").insert({
    id: teacher.id,
    name: teacher.name,
    disciplina: teacher.disciplina,
    turno: teacher.turno,
    school_id: teacher.schoolId,
    created_at: teacher.createdAt,
    share_token: teacher.shareToken,
    share_expires_at: teacher.shareExpiresAt,
    created_by: teacher.createdBy,
  });
  if (error) throw error;
  await appendAudit(teacher.createdBy ?? "sistema", "alta_maestro", teacher.name);
  return withSchool(teacher);
}

export async function updateTeacher(
  id: string,
  patch: Partial<Pick<Teacher, "name" | "disciplina" | "turno" | "schoolId">>
) {
  const current = await getTeacher(id);
  if (!current) return null;
  const next = { ...current, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) };
  await sb()
    .from("teachers")
    .update({
      name: next.name,
      disciplina: next.disciplina,
      turno: next.turno,
      school_id: next.schoolId,
    })
    .eq("id", id);
  return withSchool(next);
}

export async function deleteTeacher(id: string, actor?: string) {
  await sb().from("folder_reviews").delete().eq("teacher_id", id);
  await sb().from("class_visits").delete().eq("teacher_id", id);
  await sb().from("acknowledgments").delete().eq("teacher_id", id);
  await sb().from("teachers").delete().eq("id", id);
  await appendAudit(actor ?? "sistema", "baja_maestro", id);
}

async function withTeacher(row: RecordRow): Promise<RecordRow> {
  const teacher = await getTeacher(row.teacherId);
  return { ...row, teacher: teacher ?? undefined };
}

export async function listFolderReviews(opts?: { teacherId?: string | null; schoolId?: string | null }) {
  let q = sb().from("folder_reviews").select("*");
  if (opts?.teacherId) q = q.eq("teacher_id", opts.teacherId);
  const { data } = await q;
  let rows = await Promise.all((data ?? []).map((r) => withTeacher(mapRecord(r as Record<string, unknown>))));
  if (opts?.schoolId) rows = rows.filter((r) => r.teacher?.schoolId === opts.schoolId);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getFolderReview(id: string) {
  const { data } = await sb().from("folder_reviews").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  return withTeacher(mapRecord(data as Record<string, unknown>));
}

export async function saveFolderReview(
  teacherId: string,
  payload: unknown,
  id?: string,
  opts?: { actor?: string; expectedUpdatedAt?: string; forceNew?: boolean }
) {
  const now = new Date().toISOString();
  const existing = id ? await getFolderReview(id) : null;
  if (existing && opts?.expectedUpdatedAt && existing.updatedAt !== opts.expectedUpdatedAt) {
    throw new Error("CONFLICT");
  }
  const row: RecordRow = {
    id: existing?.id ?? crypto.randomUUID(),
    teacherId,
    payload: JSON.stringify(payload ?? {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    createdBy: existing?.createdBy ?? opts?.actor,
    updatedBy: opts?.actor,
  };
  const body = {
    id: row.id,
    teacher_id: teacherId,
    payload: payload ?? {},
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    created_by: row.createdBy,
    updated_by: row.updatedBy,
  };
  const { error } = existing
    ? await sb().from("folder_reviews").update(body).eq("id", row.id)
    : await sb().from("folder_reviews").insert(body);
  if (error) throw error;
  await appendAudit(opts?.actor ?? "sistema", existing ? "edita_carpeta" : "captura_carpeta", teacherId);
  await maybeBackup();
  return withTeacher(row);
}

export async function deleteFolderReview(id: string, actor?: string) {
  await sb().from("folder_reviews").delete().eq("id", id);
  await appendAudit(actor ?? "sistema", "baja_carpeta", id);
}

export async function listClassVisits(opts?: { teacherId?: string | null; schoolId?: string | null }) {
  let q = sb().from("class_visits").select("*");
  if (opts?.teacherId) q = q.eq("teacher_id", opts.teacherId);
  const { data } = await q;
  let rows = await Promise.all((data ?? []).map((r) => withTeacher(mapRecord(r as Record<string, unknown>))));
  if (opts?.schoolId) rows = rows.filter((r) => r.teacher?.schoolId === opts.schoolId);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getClassVisit(id: string) {
  const { data } = await sb().from("class_visits").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  return withTeacher(mapRecord(data as Record<string, unknown>));
}

export async function saveClassVisit(
  teacherId: string,
  payload: unknown,
  id?: string,
  opts?: { actor?: string; expectedUpdatedAt?: string }
) {
  const now = new Date().toISOString();
  const existing = id ? await getClassVisit(id) : null;
  if (existing && opts?.expectedUpdatedAt && existing.updatedAt !== opts.expectedUpdatedAt) {
    throw new Error("CONFLICT");
  }
  const row: RecordRow = {
    id: existing?.id ?? crypto.randomUUID(),
    teacherId,
    payload: JSON.stringify(payload ?? {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    createdBy: existing?.createdBy ?? opts?.actor,
    updatedBy: opts?.actor,
  };
  const body = {
    id: row.id,
    teacher_id: teacherId,
    payload: payload ?? {},
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    created_by: row.createdBy,
    updated_by: row.updatedBy,
  };
  const { error } = existing
    ? await sb().from("class_visits").update(body).eq("id", row.id)
    : await sb().from("class_visits").insert(body);
  if (error) throw error;
  await appendAudit(opts?.actor ?? "sistema", existing ? "edita_visita" : "captura_visita", teacherId);
  await maybeBackup();
  return withTeacher(row);
}

export async function deleteClassVisit(id: string, actor?: string) {
  await sb().from("class_visits").delete().eq("id", id);
  await appendAudit(actor ?? "sistema", "baja_visita", id);
}

export async function getDraft(userId: string, kind: string, teacherId?: string) {
  if (!teacherId) return null;
  const { data } = await sb()
    .from("drafts")
    .select("*")
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("teacher_id", teacherId)
    .maybeSingle();
  if (!data) return null;
  return {
    schoolId: String(data.school_id ?? ""),
    teacherId: String(data.teacher_id),
    payload: data.payload,
    updatedAt: String(data.updated_at),
  } as Draft;
}

export async function saveDraft(userId: string, kind: string, draft: Omit<Draft, "updatedAt">) {
  const row: Draft = { ...draft, updatedAt: new Date().toISOString() };
  const { error } = await sb().from("drafts").upsert({
    user_id: userId,
    kind,
    teacher_id: draft.teacherId,
    school_id: draft.schoolId,
    payload: draft.payload ?? {},
    updated_at: row.updatedAt,
  });
  if (error) throw error;
  return row;
}

export async function deleteDraft(userId: string, kind: string, teacherId?: string) {
  let q = sb().from("drafts").delete().eq("user_id", userId).eq("kind", kind);
  if (teacherId) q = q.eq("teacher_id", teacherId);
  await q;
}

function freshExpiry() {
  return new Date(Date.now() + SHARE_DAYS * 86400000).toISOString();
}

export function isShareActive(row: { shareToken?: string; shareExpiresAt?: string; shareRevoked?: boolean }) {
  if (!row.shareToken || row.shareRevoked) return false;
  if (row.shareExpiresAt && Date.parse(row.shareExpiresAt) < Date.now()) return false;
  return true;
}

export async function ensureShareToken(teacherId: string) {
  const t = await getTeacher(teacherId);
  if (!t) return null;
  if (!isShareActive(t)) {
    t.shareToken = crypto.randomUUID();
    t.shareExpiresAt = freshExpiry();
    t.shareRevoked = false;
    await sb()
      .from("teachers")
      .update({
        share_token: t.shareToken,
        share_expires_at: t.shareExpiresAt,
        share_revoked: false,
      })
      .eq("id", t.id);
  }
  return t;
}

export async function revokeTeacherShare(teacherId: string, actor?: string) {
  const t = await getTeacher(teacherId);
  if (!t) return null;
  t.shareRevoked = true;
  await sb().from("teachers").update({ share_revoked: true }).eq("id", teacherId);
  await appendAudit(actor ?? "sistema", "revoca_enlace", teacherId);
  return t;
}

export async function getTeacherByToken(token: string) {
  const { data } = await sb().from("teachers").select("*").eq("share_token", token).maybeSingle();
  if (!data) return null;
  const t = await withSchool(mapTeacher(data as Record<string, unknown>));
  if (!isShareActive(t)) return null;
  return t;
}

export async function getAcknowledgment(teacherId: string) {
  const { data } = await sb().from("acknowledgments").select("*").eq("teacher_id", teacherId).maybeSingle();
  return data ? mapAck(data as Record<string, unknown>) : null;
}

export async function listAcknowledgments() {
  const { data } = await sb().from("acknowledgments").select("*");
  return (data ?? []).map((r) => mapAck(r as Record<string, unknown>));
}

export async function saveAcknowledgment(ack: Acknowledgment) {
  await sb().from("acknowledgments").upsert({
    teacher_id: ack.teacherId,
    agreed: ack.agreed,
    nombre_firma: ack.nombreFirma,
    firma_data_url: ack.firmaDataUrl,
    comentario: ack.comentario,
    signed_at: ack.signedAt,
    folder_id: ack.folderId,
    visit_id: ack.visitId,
    folder_pct: ack.folderPct,
    visit_pct: ack.visitPct,
  });
  await appendAudit("docente", ack.agreed ? "firma_de_acuerdo" : "firma_en_desacuerdo", ack.teacherId);
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
  const s = await getSchool(id);
  if (!s) return null;
  if (!isShareActive(s)) {
    s.shareToken = crypto.randomUUID();
    s.shareExpiresAt = freshExpiry();
    s.shareRevoked = false;
    await sb()
      .from("schools")
      .update({
        share_token: s.shareToken,
        share_expires_at: s.shareExpiresAt,
        share_revoked: false,
      })
      .eq("id", id);
  }
  return s;
}

export async function getSchoolByToken(token: string) {
  const { data } = await sb().from("schools").select("*").eq("share_token", token).maybeSingle();
  if (!data) return null;
  const s = mapSchool(data as Record<string, unknown>);
  if (!isShareActive(s)) return null;
  return s;
}

export async function ensureZonaShareToken() {
  const { data } = await sb().from("zona_share").select("*").eq("id", "zona").maybeSingle();
  const current = data
    ? {
        shareToken: String(data.share_token ?? ""),
        shareExpiresAt: iso(data.share_expires_at as string),
        shareRevoked: Boolean(data.share_revoked),
      }
    : null;
  if (current && isShareActive(current)) return current.shareToken;
  const shareToken = crypto.randomUUID();
  await sb().from("zona_share").upsert({
    id: "zona",
    share_token: shareToken,
    share_expires_at: freshExpiry(),
    share_revoked: false,
  });
  return shareToken;
}

export async function getZonaByToken(token: string) {
  const { data } = await sb().from("zona_share").select("*").eq("id", "zona").maybeSingle();
  if (!data || data.share_token !== token) return false;
  return isShareActive({
    shareToken: String(data.share_token),
    shareExpiresAt: iso(data.share_expires_at as string),
    shareRevoked: Boolean(data.share_revoked),
  });
}

export async function getSettings(): Promise<AppSettings> {
  const { data } = await sb().from("app_settings").select("*").eq("id", "default").maybeSingle();
  if (!data) return { closedPeriods: [], updatedAt: new Date().toISOString() };
  return {
    closedPeriods: (data.closed_periods ?? []) as AppSettings["closedPeriods"],
    updatedAt: String(data.updated_at),
  };
}

export async function saveSettings(next: AppSettings, actor?: string) {
  await sb().from("app_settings").upsert({
    id: "default",
    closed_periods: next.closedPeriods,
    updated_at: next.updatedAt,
  });
  await appendAudit(actor ?? "sistema", "ajuste_periodos", next.closedPeriods.join(",") || "abiertos");
  return next;
}

export async function appendAudit(actor: string, action: string, detail: string) {
  await sb().from("audit_events").insert({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor,
    action,
    detail,
  });
}

export async function listAudit() {
  const { data } = await sb().from("audit_events").select("*").order("at", { ascending: false }).limit(200);
  return (data ?? []).map(
    (e) =>
      ({
        id: String(e.id),
        at: String(e.at),
        actor: String(e.actor ?? ""),
        action: String(e.action ?? ""),
        detail: String(e.detail ?? ""),
      }) satisfies AuditEvent
  );
}

async function maybeBackup() {
  const day = new Date().toISOString().slice(0, 10);
  const marker = await sb().storage.from(BUCKET).download("backups/last.json");
  if (marker.data) {
    const last = JSON.parse(await marker.data.text()) as { at: string };
    if (last.at === day) return;
  }
  const snapshot = {
    at: new Date().toISOString(),
    schools: await listSchools(),
    teachers: await listTeachers(),
    folders: await listFolderReviews(),
    visits: await listClassVisits(),
    acks: await listAcknowledgments(),
  };
  await putBackup(`backups/${day}.json`, snapshot);
  await putBackup("backups/last.json", { at: day });
}
