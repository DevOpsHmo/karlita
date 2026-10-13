"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VisitForm } from "@/components/VisitForm";
import { emptyVisitPayload, type VisitPayload } from "@/lib/visit-form";

export default function EditVisitPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{
    teacher: { id: string; schoolId: string };
    payload: VisitPayload;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/class-visits/${id}`)
      .then((r) => r.json())
      .then((row) => {
        setData({
          teacher: row.teacher,
          payload: { ...emptyVisitPayload(), ...JSON.parse(row.payload) },
        });
      });
  }, [id]);

  if (!data) return <p className="p-8">Cargando…</p>;
  return (
    <Suspense fallback={<p className="p-8">Cargando…</p>}>
      <VisitForm
        visitId={id}
        initialTeacherId={data.teacher.id}
        initialSchoolId={data.teacher.schoolId}
        initialPayload={data.payload}
      />
    </Suspense>
  );
}
