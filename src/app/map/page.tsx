"use client";
import { Suspense } from "react";

import MapContent from "./MapContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-lg p-8">Loading map...</div>}>
      <MapContent />
    </Suspense>
  );
}
