'use client';

interface FieldCounterProps {
  currentLength: number;
  maxLength: number;
}

export function FieldCounter({ currentLength, maxLength }: FieldCounterProps) {
  return (
    <p className="text-xs text-muted-foreground text-right">
      {currentLength} / {maxLength}
    </p>
  );
}
