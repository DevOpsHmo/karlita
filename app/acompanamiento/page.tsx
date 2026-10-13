import { Suspense } from "react";
import { VisitForm } from "@/components/VisitForm";

export default function AcompanamientoPage() {
  return (
    <Suspense fallback={<p className="p-8">Cargando…</p>}>
      <VisitForm />
    </Suspense>
  );
}
