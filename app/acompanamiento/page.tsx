import { Suspense } from "react";
import { VisitForm } from "@/components/VisitForm";
import { Loading } from "@/components/Loading";

export default function AcompanamientoPage() {
  return (
    <Suspense fallback={<Loading />}>
      <VisitForm />
    </Suspense>
  );
}
