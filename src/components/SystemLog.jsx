import { useEffect, useMemo, useState } from "react";

const SYSTEM_LINES = [
  "> booting DESTRACT TERMINAL v0.1",
  "> loading circle profile...",
  "> operator: NINGEN CHODATSU AHENKUTSU",
  "> publication node detected: DESTRACT",
  "> concept seed: 散漫 × 破裂",
  "> semantic pressure rising...",
  "> literary noise layer initialized",
  "> philosophical drift: enabled",
  "> ritual text buffer: active",
  "> status: AVAILABLE AT THIS BOOTH",
];

function useRotator(length, intervalMs) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [length, intervalMs]);

  return index;
}

function TerminalLine({ children, delay = 0 }) {
  return (
    <div
      className="animate-fadeIn font-mono text-base tracking-wide text-zinc-200 sm:text-lg md:text-xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** 一定間隔で流れるシステムログ風パネル */
export default function SystemLog({ lines = SYSTEM_LINES, visibleCount = 7, intervalMs = 1200 }) {
  const index = useRotator(lines.length, intervalMs);

  const visibleLines = useMemo(
    () => Array.from({ length: Math.min(visibleCount, lines.length) }, (_, i) => lines[(index + i) % lines.length]),
    [index, lines, visibleCount]
  );

  return (
    <section className="rounded-2xl border border-zinc-500/70 bg-zinc-950/80 p-5">
      <div className="mb-4 font-mono text-sm uppercase tracking-[0.35em] text-zinc-400">system log</div>
      <div className="space-y-2">
        {visibleLines.map((line, i) => (
          <TerminalLine key={`${line}-${i}`} delay={i * 90}>
            {line}
          </TerminalLine>
        ))}
      </div>
    </section>
  );
}
