"use client";

interface ReportButtonProps {
  active: boolean;
  onToggle: () => void;
}

export default function ReportButton({ active, onToggle }: ReportButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full py-2.5 text-[13px] font-medium rounded-2xl transition-all border ${
        active
          ? "bg-red-500/12 border-red-500/30 text-red-300"
          : "bg-[var(--color-sw-surface-3)] border-[var(--color-sw-border)] text-zinc-400 hover:border-[var(--color-sw-border-strong)] hover:text-zinc-300"
      }`}
    >
      {active ? "Click map to flag area (cancel)" : "Report unsafe area"}
    </button>
  );
}
