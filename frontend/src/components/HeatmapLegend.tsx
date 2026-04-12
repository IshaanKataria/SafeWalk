interface HeatmapLegendProps {
  visible: boolean;
}

export default function HeatmapLegend({ visible }: HeatmapLegendProps) {
  if (!visible) return null;

  return (
    <div className="animate-fade-in space-y-2 bg-[var(--color-sw-surface-2)] border border-[var(--color-sw-border)] rounded-2xl p-3">
      <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Safety heatmap</p>
      <div className="h-2.5 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 shadow-inner" />
      <div className="flex justify-between text-[10px] text-zinc-500">
        <span>Safe</span>
        <span>Moderate</span>
        <span>Avoid</span>
      </div>
    </div>
  );
}
