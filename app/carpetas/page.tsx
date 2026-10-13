import { Suspense } from "react";
import { FolderForm } from "@/components/FolderForm";
import { Loading } from "@/components/Loading";

export default function CarpetasPage() {
  return (
    <Suspense fallback={<Loading />}>
      <FolderForm />
    </Suspense>
  );
}
