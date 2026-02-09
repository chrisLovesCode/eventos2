import { cn } from "@/lib/utils";

interface UnpublishedBadgeProps {
  className?: string;
}

export function UnpublishedBadge({ className }: UnpublishedBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300",
        className
      )}
    >
      Unveröffentlicht
    </div>
  );
}
