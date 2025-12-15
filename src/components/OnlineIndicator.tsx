import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
  isOnline: boolean;
  className?: string;
}

export function OnlineIndicator({ isOnline, className }: OnlineIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-block w-2.5 h-2.5 rounded-full",
        isOnline ? "bg-green-500" : "bg-muted-foreground/30",
        className
      )}
      title={isOnline ? "Online" : "Offline"}
    />
  );
}
