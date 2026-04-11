"use client";

interface ReportButtonProps {
  active: boolean;
  onToggle: () => void;
}

export default function ReportButton({ active, onToggle }: ReportButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full py-2.5 font-medium rounded-lg transition-colors border ${
        active
          ? "bg-red-500/20 border-red-500/60 text-red-300"
          : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600"
      }`}
    >
      {active ? "Click on map to flag unsafe area (cancel)" : "Report unsafe area"}
    </button>
  );
}
