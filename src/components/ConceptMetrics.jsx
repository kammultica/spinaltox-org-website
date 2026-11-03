const METRICS = [
  ["思想圧", 99],
  ["文学濃度", 99],
  ["思想濃度", 96],
  ["破裂度", 99],
  ["可読性", 52],
  ["異物混入率", 83],
];

function MetricBar({ label, value }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between font-mono text-xs text-zinc-300 md:text-sm">
        <span>{label}</span>
        <span>{String(value).padStart(3, "0")}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-zinc-500/60 bg-black/70">
        <div className="h-full bg-zinc-100 shadow-[0_0_16px_rgba(255,255,255,0.65)]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/** 架空の指標をバーで並べるパネル */
export default function ConceptMetrics({ metrics = METRICS }) {
  return (
    <section className="rounded-2xl border border-zinc-500/70 bg-zinc-950/80 p-5">
      <div className="mb-4 font-mono text-sm uppercase tracking-[0.35em] text-zinc-400">concept metrics</div>
      <div className="space-y-4">
        {metrics.map(([label, value]) => (
          <MetricBar key={label} label={label} value={value} />
        ))}
      </div>
    </section>
  );
}
