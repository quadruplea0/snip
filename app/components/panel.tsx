import type { ReactNode } from "react";

export default function Panel({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative border border-line ${className}`}>
      <span className="absolute -top-[9px] left-2 rounded-[2px] bg-background px-1.5 py-[3px] text-[10px] leading-none tracking-tight text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}
