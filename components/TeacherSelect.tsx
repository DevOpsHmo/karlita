"use client";

import { useEffect, useState } from "react";
import { Select, TURNO_OPTIONS } from "./Select";

type School = { id: string; name: string; shortName: string; cct: string };
type Teacher = {
  id: string;
  name: string;
  disciplina: string;
  turno: string;
  schoolId: string;
};

export function TeacherSelect({
  schoolId,
  teacherId,
  onSchool,
  onTeacher,
  onTeacherMeta,
}: {
  schoolId: string;
  teacherId: string;
  onSchool: (id: string) => void;
  onTeacher: (id: string) => void;
  onTeacherMeta?: (t: Teacher | null) => void;
}) {
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDisc, setNewDisc] = useState("");
  const [newTurno, setNewTurno] = useState("Matutino");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/schools")
      .then((r) => r.json())
      .then(setSchools);
  }, []);

  useEffect(() => {
    if (!schoolId) {
      setTeachers([]);
      return;
    }
    fetch(`/api/teachers?schoolId=${schoolId}`)
      .then((r) => r.json())
      .then(setTeachers);
  }, [schoolId]);

  useEffect(() => {
    const t = teachers.find((x) => x.id === teacherId) ?? null;
    onTeacherMeta?.(t);
  }, [teacherId, teachers, onTeacherMeta]);

  async function createTeacher() {
    if (!schoolId || !newName.trim() || saving) return;
    setSaving(true);
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId,
        name: newName,
        disciplina: newDisc,
        turno: newTurno,
      }),
    });
    const t = await res.json();
    setSaving(false);
    if (!res.ok) return;
    setTeachers((prev) => {
      if (prev.some((x) => x.id === t.id)) return prev;
      return [...prev, t].sort((a, b) => a.name.localeCompare(b.name));
    });
    onTeacher(t.id);
    setCreating(false);
    setNewName("");
    setNewDisc("");
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm">
        Escuela
        <Select
          className="mt-1"
          value={schoolId}
          placeholder="Seleccione escuela…"
          onChange={(id) => {
            onSchool(id);
            onTeacher("");
          }}
          options={schools.map((s) => ({ value: s.id, label: `${s.shortName} · ${s.cct}` }))}
        />
      </label>
      <label className="block text-sm">
        Docente
        <Select
          className="mt-1"
          value={teacherId}
          placeholder={schoolId ? "Seleccione docente…" : "Primero elija escuela"}
          disabled={!schoolId}
          onChange={onTeacher}
          options={teachers.map((t) => ({ value: t.id, label: t.name }))}
        />
      </label>
      <div className="sm:col-span-2">
        {!creating ? (
          <button
            type="button"
            className="text-sm text-[#6a0938] underline"
            onClick={() => setCreating(true)}
            disabled={!schoolId}
          >
            + Registrar docente nuevo en esta visita
          </button>
        ) : (
          <div className="grid gap-2 rounded-xl border border-dashed border-[#c4a35a] bg-white p-3 sm:grid-cols-4">
            <input
              className="rounded-lg border border-[#d9c9a3] px-3 py-2 sm:col-span-2"
              placeholder="Nombre del docente"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              className="rounded-lg border border-[#d9c9a3] px-3 py-2"
              placeholder="Disciplina"
              value={newDisc}
              onChange={(e) => setNewDisc(e.target.value)}
            />
            <Select value={newTurno} onChange={setNewTurno} options={TURNO_OPTIONS} />
            <div className="flex gap-2 sm:col-span-4">
              <button
                type="button"
                onClick={createTeacher}
                disabled={saving}
                className="rounded-lg bg-[#6a0938] px-3 py-2 text-sm text-white disabled:opacity-60"
              >
                Guardar docente
              </button>
              <button type="button" onClick={() => setCreating(false)} className="text-sm underline">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
