import { Suspense } from "react";
import { FolderForm } from "@/components/FolderForm";

export default function CarpetasPage() {
  return (
    <Suspense fallback={<p className="p-8">Cargando…</p>}>
      <FolderForm />
    </Suspense>
  );
}
