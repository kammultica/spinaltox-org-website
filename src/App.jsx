import { useEffect, useState } from "react";
import CoreExplorer from "./CoreExplorer.jsx";
import { BOOTH } from "./data/booth.js";
import SiteFooter from "./components/SiteFooter.jsx";
// いったん画面から外しているが、いつでも戻せるコンポーネント:
//   import SystemLog from "./components/SystemLog.jsx";
//   import ConceptMetrics from "./components/ConceptMetrics.jsx";
//   import Footer from "./components/Footer.jsx";

/**
 * DESTRACT TERMINAL
 *
 */

// 読み込み中の待機画面にランダムで1つ表示する
const HEADLINES = [
  { header: "人間超脱阿片窟", content: "「超脱」とは、人間であることそのものを辞めることである。" },
  { header: "人間超脱阿片窟", content: "「人間超脱」とは、「人間とは何か」という問いを立てることを辞めることである。" },
  { header: "人間超脱阿片窟", content: "「人間超脱」とは、「自らは人間である」と宣言することを辞めることである。" },
  { header: "Distraction × Destruction = Destraction", content: "『散裂』とは、「散漫」と「破裂」を組み合わせた造語である。" },
  { header: "Distraction × Destruction = Destraction", content: "「超脱者」として洞察するためには、人間が知りうるものの総体を一度破壊しなければならない。" },
  { header: "Distraction × Destruction = Destraction", content: "散裂の地平において、語彙はもはや、辞書を参照するだけでは決して追い切れない。" },
  { header: "Distraction × Destruction = Destraction", content: "散裂の地平において、語彙はもはや、固定された意味を保持しない。" },
  { header: "宣伝", content: "各号、見本誌あります。\nご自由にお読みください。" },
  { header: "Vol.01 テーマ: 抽象文学", content: "文学は自律し、自我を持ち、欲動する。その力の源は抽象にある。" },
  { header: "Vol.01 テーマ: 抽象文学", content: "文学はもはや、何が文学で何がそうでないかを分別する形式の軛から完全に解放される。" },
  { header: "Vol.01 テーマ: 抽象文学", content: "抽象文学は「無性」「無限」「無羈」の3つの性質をもつ。" },
  { header: "喧伝", content: "各号、見本誌あります。\nご自由にお読みください。" },
  { header: "Vol.02 テーマ: 真理", content: "自然法則が一定不変のように見えているのは、偶然である。" },
  { header: "Vol.02 テーマ: 真理", content: "実体の｛見え｝ない神の効用のすべては自然の性質へと還元される。" },
  { header: "Vol.02 テーマ: 真理", content: "［真理＝veritas］とは、世界についての完全な知識のことである。" },
  { header: "宣伝", content: "各号、見本誌あります。\nご自由にお読みください。" },
  { header: "Vol.03 テーマ: 世界", content: "「文学」は、文字の羅列という〔存在者―群〕が、ある秩序によって確定している系であり、これは定義により世界である。" },
  { header: "Vol.03 テーマ: 世界", content: "［圜＝スフィア］とは、任意の数の［属性＝プロパティ］をもつものである。" },
  { header: "Vol.03 テーマ: 世界", content: "かつて［圜＝スフィア］とは、自他の境界をもって互いに通信する実体のことだった。" },
  { header: "喧伝", content: "各号、見本誌あります。\nご自由にお読みください。" },
  { header: "Vol.04 テーマ: クィアライズ", content: "我々は皆「クィア」である。" },
  { header: "Vol.04 テーマ: クィアライズ", content: "「クィア」とは、単に性的指向や性自認に関わるものではない。" },
  { header: "Vol.04 テーマ: クィアライズ", content: "「クィア」とはむしろ、固定された［範疇＝カテゴリ］に抗う態度のことである。" },
  { header: "Vol.04 テーマ: クィアライズ", content: "もし「死後の世界に到達したい」と願うなら、我々はそれを物理的に実装することができる。" },
  { header: "宣伝", content: "各号、見本誌あります。\nご自由にお読みください。" },
  { header: "Vol.05 テーマ: 神臓／汎言語", content: "「バベルの塔」を修復する。" },
  { header: "Vol.05 テーマ: 神臓／汎言語", content: "「Lexora」とは、バベルの塔の再建計画である。" },
  { header: "Vol.05 テーマ: 神臓／汎言語", content: "「Lexora」は、時制・相・法・態などの文法範疇を語形から切り離す、完全言語フレームワークである。" },
  { header: "喧伝", content: "各号、見本誌あります。\nご自由にお読みください。" },
];

const TAGS = ["抽象文学", "真理", "世界", "クィアライズ", "神虁", "汎言語", "渾沌", "実験文学"];

function useClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return now;
}

function Scanlines() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40 mix-blend-screen">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:100%_4px]" />
      <div className="animate-scan absolute left-0 top-0 h-24 w-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
    </div>
  );
}

// 背景画像（public/background.png）を透過させて全面に固定表示
function BackgroundImage() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.14] grayscale"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}background.png)` }}
      />
      {/* 文字の可読性のため、周辺を黒く沈める */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}

function NoiseGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-25">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_20%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.1),transparent_24%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.12),transparent_26%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:48px_48px]" />
    </div>
  );
}

export default function App() {
  const now = useClock();
  const [idleQuote] = useState(() => HEADLINES[Math.floor(Math.random() * HEADLINES.length)].content);

  const timeText = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-zinc-100">
      <BackgroundImage />
      <NoiseGrid />
      <Scanlines />

      <section className="relative z-10 flex min-h-screen flex-col p-4 md:p-8 lg:h-screen">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-zinc-500/70 pb-4 font-mono">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-zinc-400 md:text-sm">DESTRACT TERMINAL</div>
            <h1 className="glitch mt-2 text-3xl font-black tracking-[0.12em] sm:text-4xl sm:tracking-[0.18em] text-zinc-100 md:text-7xl">
              {BOOTH.publication}
            </h1>
          </div>
          <div className="text-right text-xs text-zinc-300 md:text-base">
            <div>STATUS: ONLINE</div>
            <div>TIME: {timeText}</div>
            <div>NODE: WEB</div>
          </div>
        </header>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-zinc-500/70 bg-zinc-950/70 p-4 shadow-[0_0_40px_rgba(255,255,255,0.08)] md:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="inline-block border border-zinc-400/80 px-3 py-1 font-mono text-sm tracking-widest text-zinc-200 md:text-base">
              {BOOTH.circleName}
            </div>
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-zinc-400 md:text-sm">
              archive node: 思想集積所
            </div>
          </div>

          <CoreExplorer idleQuote={idleQuote} />

          <div className="mt-4 grid grid-cols-4 gap-2 font-mono text-xs text-zinc-300 xl:grid-cols-8">
            {TAGS.map((tag) => (
              <div key={tag} className="rounded-lg border border-zinc-600/80 bg-black/60 px-2 py-1 text-center">
                {tag}
              </div>
            ))}
          </div>
        </section>

        <SiteFooter />
      </section>
    </main>
  );
}
