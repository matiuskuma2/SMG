"use client";

import { EnqueteForm } from "../../../../components/enquete/EnqueteForm";

export default function EnquetePage({ params }: { params: { id: string } }) {
  return <EnqueteForm enqueteId={params.id} />;
}
