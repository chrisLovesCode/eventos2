"use client";

import { useEffect } from "react";
import { Button } from "@/components/commons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-semibold">Etwas ist schief gelaufen!</h2>
      <Button onClick={reset}>
        Erneut versuchen
      </Button>
    </div>
  );
}
