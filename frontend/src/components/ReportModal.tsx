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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Report unsafe area</h2>
            <p className="text-xs text-zinc-500 mt-1">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What did you notice?"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
