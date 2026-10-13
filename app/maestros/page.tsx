"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Select, TURNO_OPTIONS } from "@/components/Select";

type School = { id: string; name: string; shortName: string; cct: string };
type Teacher = {
  id: string;
  name: string;
  disciplina: string;
  turno: string;
  schoolId: string;
  school: School;
};

export default function MaestrosPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [name, setName] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [turno, setTurno] = useState("Matutino");
  const [role, setRole] = useState("atp");

  async function load(sid = schoolId) {
    const [s, t] = await Promise.all([
      fetch("/api/schools").then((r) => r.json()),
      fetch(sid ? `/api/teachers?schoolId=${sid}` : "/api/teachers").then((r) => r.json()),
    ]);
    setSchools(s);
    setTeachers(t);
  }

  useEffect(() => {
    load();
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setRole(d.role));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId || !name.trim()) return;
    await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId, name, disciplina, turno }),
    });
    setName("");
    setDisciplina("");
    load(schoolId);
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este docente y sus registros?")) return;
    await fetch(`/api/teachers/${id}`, { method: "DELETE" });
    load(schoolId);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold text-[#6a0938]">Maestros</h1>
      <form onSubmit={add} className="mb-6 grid gap-2 rounded-2xl bg-[#fffdf8] p-4 ring-1 ring-[#e6dcc8] sm:grid-cols-2">
        <Select
          className="sm:col-span-2"
          required
          placeholder="Escuela…"
          value={schoolId}
          onChange={(id) => {
            setSchoolId(id);
            load(id);
          }}
          options={schools.map((s) => ({ value: s.id, label: `${s.shortName} · ${s.cct}` }))}
        />
        <input
          className="rounded-lg border border-[#d9c9a3] px-3 py-2"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="rounded-lg border border-[#d9c9a3] px-3 py-2"
          placeholder="Disciplina"
          value={disciplina}
          onChange={(e) => setDisciplina(e.target.value)}
        />
        <Select value={turno} onChange={setTurno} options={TURNO_OPTIONS} />
        <button className="rounded-lg bg-[#6a0938] py-2 text-white">Agregar</button>
      </form>
      <ul className="space-y-2">
        {teachers.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-xl bg-[#fffdf8] px-4 py-3 ring-1 ring-[#e6dcc8]">
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-[#5a6b5e]">
                {t.school.shortName} · {t.disciplina || "Sin disciplina"} · {t.turno}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <Link className="text-[#6a0938] underline" href={`/resultados/maestro/${t.id}`}>
                Ficha
              </Link>
              {role === "supervision" && (
                <button type="button" className="cursor-pointer text-red-700" onClick={() => remove(t.id)}>
                  Eliminar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
