import { BOOTH } from "../data/booth.js";

const MARQUEE_ITEMS = [
  "機関誌『散裂』頒布中",
  "人間超脱阿片窟",
  "散漫 × 破裂 = 『散裂』",
  "Distraction × Destruction = \"Destraction\"",
  "見本誌はご自由に閲覧可能",
  "文学・思想・実験散文",
];

function Marquee({ items }) {
  const text = items.join("　　/　　");
  return (
    <div className="overflow-hidden border-y border-zinc-500/70 bg-zinc-950/90 py-3 font-mono text-xl tracking-widest text-zinc-100 md:text-3xl">
      <div className="animate-marquee whitespace-nowrap">
        {text}/{text}/{text}
      </div>
    </div>
  );
}

/** 流れるテキスト＋頒布情報の帯 */
export default function Footer({ booth = BOOTH, marqueeItems = MARQUEE_ITEMS }) {
  return (
    <footer className="mt-4 space-y-4">
      <Marquee items={marqueeItems} />

      <div className="grid gap-3 rounded-2xl border border-zinc-500/70 bg-zinc-100 px-5 py-4 font-black text-black md:grid-cols-4 md:items-center md:text-center">
        <div className="text-2xl md:text-4xl">{booth.issue}</div>
        <div className="text-xl md:text-3xl">{booth.price}</div>
        <div className="text-xl md:text-3xl">{booth.note}</div>
        <div className="text-base md:text-2xl">{booth.subtitle}</div>
      </div>
    </footer>
  );
}
