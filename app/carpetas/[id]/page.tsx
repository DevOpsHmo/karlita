"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FolderForm } from "@/components/FolderForm";
import { Loading } from "@/components/Loading";
import { emptyFolderPayload, type FolderPayload } from "@/lib/folder-form";

export default function EditFolderPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{
    teacher: { id: string; schoolId: string };
    payload: FolderPayload;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/folder-reviews/${id}`)
      .then((r) => r.json())
      .then((row) => {
        setData({
          teacher: row.teacher,
          payload: { ...emptyFolderPayload(), ...JSON.parse(row.payload) },
        });
      });
  }, [id]);

  if (!data) return <Loading />;
  return (
    <Suspense fallback={<Loading />}>
      <FolderForm
        reviewId={id}
        initialTeacherId={data.teacher.id}
        initialSchoolId={data.teacher.schoolId}
        initialPayload={data.payload}
      />
    </Suspense>
  );
}
