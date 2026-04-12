"use client";

import { useEffect, useRef, useState } from "react";

interface InfoTooltipProps {
  text: string;
  children: React.ReactNode;
}

export default function InfoTooltip({ text, children }: InfoTooltipProps) {
  const [showInfo, setShowInfo] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showInfo) return;

    function handleDismiss(e: Event) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowInfo(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setShowInfo(false);
    }

    document.addEventListener("mousedown", handleDismiss);
    document.addEventListener("touchstart", handleDismiss);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleDismiss);
      document.removeEventListener("touchstart", handleDismiss);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showInfo]);

  return (
    <div className="relative" ref={wrapperRef}>
      {children}

      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowInfo((v) => !v);
        }}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10
                   w-5 h-5 rounded-full
                   bg-zinc-700/60 border border-zinc-600/40 text-zinc-400
                   hover:bg-zinc-600/60 hover:text-zinc-200
                   flex items-center justify-center transition-all text-[11px] font-semibold"
        aria-label="More information"
      >
        i
      </button>

      {showInfo && (
        <div
          className="absolute bottom-full left-0 mb-2 w-52 z-[60]
                     bg-[var(--color-sw-surface-2)] border border-[var(--color-sw-border)]
                     rounded-xl p-3 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.7)]"
        >
          <p className="text-[12px] text-zinc-300 leading-relaxed">{text}</p>
          <div
            className="absolute bottom-[-5px] right-4 w-2.5 h-2.5 rotate-45
                        bg-[var(--color-sw-surface-2)] border-r border-b border-[var(--color-sw-border)]"
          />
        </div>
      )}
    </div>
  );
}
