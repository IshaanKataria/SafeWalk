"use client";

import { useState } from "react";
import { LatLng, ReportCategory } from "@/types";

interface ReportModalProps {
  location: LatLng | null;
  onClose: () => void;
  onSubmit: (category: ReportCategory, description: string) => Promise<void>;
}

const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "lighting", label: "Poor lighting" },
  { value: "crime", label: "Crime incident" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
];

export default function ReportModal({ location, onClose, onSubmit }: ReportModalProps) {
  const [category, setCategory] = useState<ReportCategory>("lighting");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!location) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(category, description);
      setDescription("");
      setCategory("lighting");
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-sw-surface-1)] border border-[var(--color-sw-border)] rounded-3xl p-6 w-full max-w-md
                      shadow-[0_24px_80px_-12px_rgba(0,0,0,0.8)]">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-[16px] font-semibold">Report unsafe area</h2>
            <p className="text-[11px] text-zinc-600 mt-1 tabular-nums">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-sw-surface-3)] text-zinc-500 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full px-4 py-2.5 bg-[var(--color-sw-surface-3)] border border-[var(--color-sw-border)] rounded-xl text-[14px] text-white
                         focus:outline-none focus:border-[var(--color-sw-green)]/40"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What did you notice?"
              className="w-full px-4 py-2.5 bg-[var(--color-sw-surface-3)] border border-[var(--color-sw-border)] rounded-xl text-[14px] text-white
                         placeholder-zinc-600 focus:outline-none focus:border-[var(--color-sw-green)]/40 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-[var(--color-sw-surface-3)] border border-[var(--color-sw-border)] text-zinc-400 hover:text-zinc-200
                         rounded-2xl text-[13px] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-gradient-to-b from-green-500 to-green-600 disabled:from-zinc-700 disabled:to-zinc-800
                         text-white disabled:text-zinc-500 rounded-2xl text-[13px] font-semibold transition-all
                         shadow-[0_2px_12px_rgba(34,197,94,0.3)] disabled:shadow-none"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
