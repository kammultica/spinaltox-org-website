import { TbBrandAmazon, TbBrandX, TbMail } from "react-icons/tb"; // Tabler Icons (MIT)

const LINKS = [
  { label: "X (@kammulticae)", href: "https://x.com/kammulticae", Icon: TbBrandX, external: true },
  { label: "メール", href: "mailto:kammultica@gmail.com", Icon: TbMail, external: false },
  {
    label: "Kindle で「kammultica」を検索",
    href: "https://www.amazon.co.jp/s?k=kammultica&i=digital-text",
    Icon: TbBrandAmazon,
    external: true,
  },
];

/** サイト共通のシンプルなフッター */
export default function SiteFooter() {
  return (
    <footer className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-500/70 pt-3 font-mono text-xs text-zinc-400 md:text-sm">
      <div>©2026 spinaltox edited by kammultica</div>
      <ul className="flex items-center gap-2">
        {LINKS.map(({ label, href, Icon, external }) => (
          <li key={href}>
            <a
              href={href}
              aria-label={label}
              title={label}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-600/80 bg-black/60 text-zinc-300 transition-colors hover:border-zinc-200 hover:bg-zinc-100 hover:text-black"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
