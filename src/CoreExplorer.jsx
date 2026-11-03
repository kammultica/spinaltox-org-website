import React, { useCallback, useEffect, useMemo, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

/**
 * CORE EXPLORER
 * github.com/kammultica/Core のフォルダ構造を探索し、.md のみを HTML に変換して表示する。
 * ルーティングはハッシュ (#/dir/ または #/dir/file.md) で行う（GitHub Pages で 404 にならないため）。
 */

const REPO = { owner: "kammultica", name: "Core", branch: "main" };
const REPO_LABEL = `${REPO.owner}/${REPO.name}`;
const TREE_CACHE_KEY = `core-explorer:tree:${REPO_LABEL}@${REPO.branch}`;
const TREE_CACHE_TTL = 10 * 60 * 1000;

const encodePath = (path) => path.split("/").map(encodeURIComponent).join("/");
const rawUrl = (path) =>
  `https://raw.githubusercontent.com/${REPO.owner}/${REPO.name}/${REPO.branch}/${encodePath(path)}`;
const githubUrl = (path, isDir = false) =>
  path
    ? `https://github.com/${REPO.owner}/${REPO.name}/${isDir ? "tree" : "blob"}/${REPO.branch}/${encodePath(path)}`
    : `https://github.com/${REPO.owner}/${REPO.name}`;
const isMarkdown = (path) => /\.md$/i.test(path);
const dirname = (path) => (path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "");
const basename = (path) => path.slice(path.lastIndexOf("/") + 1);

/* ---------- tree fetching ---------- */

async function fetchFromGitHubApi() {
  const res = await fetch(
    `https://api.github.com/repos/${REPO.owner}/${REPO.name}/git/trees/${REPO.branch}?recursive=1`,
    { headers: { Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = await res.json();
  return data.tree.filter((e) => e.type === "blob").map((e) => e.path);
}

// GitHub API のレート制限（未認証 60回/時）に掛かったときの予備経路
async function fetchFromJsDelivr() {
  const res = await fetch(
    `https://data.jsdelivr.com/v1/packages/gh/${REPO.owner}/${REPO.name}@${REPO.branch}?structure=flat`
  );
  if (!res.ok) throw new Error(`jsDelivr ${res.status}`);
  const data = await res.json();
  return data.files.map((f) => f.name.replace(/^\//, ""));
}

async function loadMarkdownPaths() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(TREE_CACHE_KEY) || "null");
    if (cached && Date.now() - cached.at < TREE_CACHE_TTL) return cached.paths;
  } catch {
    /* storage unavailable */
  }

  let paths;
  try {
    paths = await fetchFromGitHubApi();
  } catch {
    paths = await fetchFromJsDelivr();
  }
  paths = paths.filter(isMarkdown).sort((a, b) => a.localeCompare(b, "ja"));

  try {
    sessionStorage.setItem(TREE_CACHE_KEY, JSON.stringify({ at: Date.now(), paths }));
  } catch {
    /* storage unavailable */
  }
  return paths;
}

/** .md のパス一覧から、md を含むディレクトリだけで構成された木を作る */
function buildTree(paths) {
  const root = { name: "", path: "", dirs: new Map(), files: [] };
  for (const path of paths) {
    const parts = path.split("/");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const dirPath = parts.slice(0, i + 1).join("/");
      if (!node.dirs.has(parts[i])) {
        node.dirs.set(parts[i], { name: parts[i], path: dirPath, dirs: new Map(), files: [] });
      }
      node = node.dirs.get(parts[i]);
    }
    node.files.push({ name: parts[parts.length - 1], path });
  }
  return root;
}

function findDir(tree, dirPath) {
  if (!dirPath) return tree;
  let node = tree;
  for (const part of dirPath.split("/")) {
    node = node.dirs.get(part);
    if (!node) return null;
  }
  return node;
}

const sortedDirs = (node) => [...node.dirs.values()].sort((a, b) => a.name.localeCompare(b.name, "ja"));
const sortedFiles = (node) =>
  [...node.files].sort((a, b) => {
    const ra = /^readme\.md$/i.test(a.name) ? 0 : 1;
    const rb = /^readme\.md$/i.test(b.name) ? 0 : 1;
    return ra - rb || a.name.localeCompare(b.name, "ja");
  });
const findReadme = (node) => node?.files.find((f) => /^readme\.md$/i.test(f.name));

/* ---------- routing ---------- */

function readRoute() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  let path;
  try {
    path = decodeURIComponent(raw);
  } catch {
    path = raw;
  }
  if (!path || path.endsWith("/")) return { type: "dir", path: path.replace(/\/+$/, "") };
  return { type: isMarkdown(path) ? "file" : "dir", path };
}

const routeHref = (path, isDir) => `#/${encodePath(path)}${isDir && path ? "/" : ""}`;

function useHashRoute() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

/* ---------- markdown ---------- */

marked.setOptions({ gfm: true, breaks: false });

function resolveRelative(baseDir, href) {
  const base = `https://core.invalid/${baseDir ? encodePath(baseDir) + "/" : ""}`;
  const url = new URL(href, base);
  return {
    path: decodeURIComponent(url.pathname.replace(/^\//, "")),
    hash: url.hash,
  };
}

const isExternal = (href) => /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//");

function renderMarkdown(source, filePath) {
  const baseDir = dirname(filePath);
  const html = marked.parse(source);
  const doc = new DOMParser().parseFromString(DOMPurify.sanitize(html), "text/html");

  doc.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (href.startsWith("#")) {
      a.setAttribute("data-anchor", "true");
      return;
    }
    if (isExternal(href)) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
      return;
    }
    const { path } = resolveRelative(baseDir, href);
    if (isMarkdown(path)) {
      a.setAttribute("href", routeHref(path, false));
    } else {
      // md 以外は表示対象外なので GitHub 側へ逃がす
      a.setAttribute("href", githubUrl(path, href.endsWith("/")));
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
  });

  doc.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src");
    if (!isExternal(src) && !src.startsWith("data:")) {
      img.setAttribute("src", rawUrl(resolveRelative(baseDir, src).path));
    }
    img.setAttribute("loading", "lazy");
  });

  return doc.body.innerHTML;
}

const fileCache = new Map();

async function loadFile(path) {
  if (fileCache.has(path)) return fileCache.get(path);
  const res = await fetch(rawUrl(path));
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const html = renderMarkdown(await res.text(), path);
  fileCache.set(path, html);
  return html;
}

/* ---------- UI ---------- */

function TreeDir({ node, depth, route, expanded, toggle }) {
  const isOpen = expanded.has(node.path);
  const active = route.type === "dir" && route.path === node.path;
  return (
    <li>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => toggle(node.path)}
          className="w-5 shrink-0 text-zinc-500 hover:text-zinc-100"
          aria-label={isOpen ? "折りたたむ" : "展開する"}
          aria-expanded={isOpen}
        >
          {isOpen ? "▾" : "▸"}
        </button>
        <a
          href={routeHref(node.path, true)}
          onClick={() => !isOpen && toggle(node.path)}
          className={`min-w-0 flex-1 truncate rounded px-1 py-0.5 ${
            active ? "bg-zinc-100 text-black" : "text-zinc-200 hover:bg-zinc-800"
          }`}
        >
          {node.name}/
        </a>
      </div>
      {isOpen && <TreeChildren node={node} depth={depth + 1} route={route} expanded={expanded} toggle={toggle} />}
    </li>
  );
}

function TreeChildren({ node, depth, route, expanded, toggle }) {
  return (
    <ul className={depth > 0 ? "ml-2 border-l border-zinc-700/80 pl-2" : ""}>
      {sortedDirs(node).map((dir) => (
        <TreeDir key={dir.path} node={dir} depth={depth} route={route} expanded={expanded} toggle={toggle} />
      ))}
      {sortedFiles(node).map((file) => {
        const active = route.type === "file" && route.path === file.path;
        return (
          <li key={file.path} className="flex items-center">
            <span className="w-5 shrink-0 text-zinc-600">·</span>
            <a
              href={routeHref(file.path, false)}
              title={file.name}
              className={`min-w-0 flex-1 truncate rounded px-1 py-0.5 ${
                active ? "bg-zinc-100 text-black" : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              }`}
            >
              {file.name.replace(/\.md$/i, "")}
              <span className="text-zinc-500">.md</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function Breadcrumbs({ path, isDir }) {
  const parts = path ? path.split("/") : [];
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-1 font-mono text-xs text-zinc-400 md:text-sm">
      <a href="#/" className="text-zinc-200 hover:underline">
        {REPO_LABEL}
      </a>
      <span>:</span>
      {parts.map((part, i) => {
        const sub = parts.slice(0, i + 1).join("/");
        const last = i === parts.length - 1;
        return (
          <React.Fragment key={sub}>
            <span className="text-zinc-600">/</span>
            {last ? (
              <span className="text-zinc-100">{part}</span>
            ) : (
              <a href={routeHref(sub, true)} className="hover:text-zinc-100 hover:underline">
                {part}
              </a>
            )}
          </React.Fragment>
        );
      })}
      {isDir && <span className="text-zinc-600">/</span>}
      <span className="ml-2 text-zinc-500">
        $ {isDir ? "ls" : `cat ${basename(path)}`}
        <span className="cursor-blink">_</span>
      </span>
    </div>
  );
}

function DirListing({ node }) {
  const dirs = sortedDirs(node);
  const files = sortedFiles(node);
  return (
    <ul className="grid gap-2 font-mono text-sm sm:grid-cols-2 md:text-base">
      {dirs.map((d) => (
        <li key={d.path}>
          <a
            href={routeHref(d.path, true)}
            className="flex items-center gap-3 rounded-lg border border-zinc-600/80 bg-black/60 px-3 py-2 hover:border-zinc-200 hover:bg-zinc-900"
          >
            <span className="shrink-0 text-zinc-500">[DIR]</span>
            <span className="truncate">{d.name}/</span>
          </a>
        </li>
      ))}
      {files.map((f) => (
        <li key={f.path}>
          <a
            href={routeHref(f.path, false)}
            title={f.name}
            className="flex items-center gap-3 rounded-lg border border-zinc-600/80 bg-black/60 px-3 py-2 hover:border-zinc-200 hover:bg-zinc-900"
          >
            <span className="shrink-0 whitespace-pre text-zinc-500">[ MD]</span>
            <span className="truncate">{f.name}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Article({ path }) {
  const [state, setState] = useState({ path: null, html: "", error: null });

  useEffect(() => {
    let alive = true;
    loadFile(path)
      .then((html) => alive && setState({ path, html, error: null }))
      .catch((e) => alive && setState({ path, html: "", error: e.message }));
    return () => {
      alive = false;
    };
  }, [path]);

  const onClick = useCallback((e) => {
    const a = e.target.closest("a[data-anchor]");
    if (a) e.preventDefault();
  }, []);

  if (state.path !== path) return <StatusLine>{`> fetching ${basename(path)} ...`}</StatusLine>;
  if (state.error) return <StatusLine error>{`> read error: ${state.error}`}</StatusLine>;

  return (
    <article
      key={path}
      onClick={onClick}
      className="md-body animate-fadeIn"
      dangerouslySetInnerHTML={{ __html: state.html }}
    />
  );
}

function StatusLine({ children, error = false }) {
  return (
    <div className={`font-mono text-sm md:text-base ${error ? "text-zinc-100" : "text-zinc-400"}`}>
      {children}
      <span className="cursor-blink">_</span>
    </div>
  );
}

export default function CoreExplorer({ idleQuote }) {
  const route = useHashRoute();
  const [paths, setPaths] = useState(null);
  const [error, setError] = useState(null);
  // ユーザーが明示的に開閉したディレクトリ（path → boolean）
  const [overrides, setOverrides] = useState(() => new Map());

  useEffect(() => {
    loadMarkdownPaths()
      .then(setPaths)
      .catch((e) => setError(e.message));
  }, []);

  const tree = useMemo(() => (paths ? buildTree(paths) : null), [paths]);

  // 現在地の祖先ディレクトリは既定で展開する
  const ancestors = useMemo(() => {
    const dir = route.type === "file" ? dirname(route.path) : route.path;
    const parts = dir ? dir.split("/") : [];
    return new Set(parts.map((_, i) => parts.slice(0, i + 1).join("/")));
  }, [route]);

  const expanded = useMemo(
    () => ({ has: (p) => (overrides.has(p) ? overrides.get(p) : ancestors.has(p)) }),
    [overrides, ancestors]
  );

  const toggle = useCallback(
    (p) => setOverrides((prev) => new Map(prev).set(p, !expanded.has(p))),
    [expanded]
  );

  // ページ切替時は本文の先頭へ
  useEffect(() => {
    document.getElementById("core-explorer-view")?.scrollTo({ top: 0 });
  }, [route.path]);

  let body;
  if (error) {
    body = <StatusLine error>{`> connection failed: ${error}`}</StatusLine>;
  } else if (!tree) {
    body = (
      <div className="space-y-6">
        <StatusLine>{`> scanning ${REPO_LABEL} ...`}</StatusLine>
        {idleQuote && (
          <p className="animate-fadeIn whitespace-pre-wrap text-2xl font-black leading-tight tracking-wide text-zinc-300 md:text-4xl">
            {idleQuote}
          </p>
        )}
      </div>
    );
  } else if (route.type === "file") {
    body = paths.includes(route.path) ? (
      <Article path={route.path} />
    ) : (
      <StatusLine error>{`> no such file: ${route.path}`}</StatusLine>
    );
  } else {
    const node = findDir(tree, route.path);
    const readme = findReadme(node);
    body = node ? (
      <div className="space-y-10">
        <DirListing node={node} />
        {readme && (
          <div className="border-t border-zinc-700/80 pt-10">
            <div className="mb-4 font-mono text-xs uppercase tracking-[0.35em] text-zinc-500">{readme.name}</div>
            <Article path={readme.path} />
          </div>
        )}
      </div>
    ) : (
      <StatusLine error>{`> no such directory: ${route.path}`}</StatusLine>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-700/80 pb-3">
        <Breadcrumbs path={route.path} isDir={route.type === "dir"} />
        <a
          href={githubUrl(route.path, route.type === "dir")}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-zinc-500 hover:text-zinc-100 md:text-sm"
        >
          [open on GitHub ↗]
        </a>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[minmax(230px,280px)_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <nav className="min-h-0 overflow-auto rounded-xl border border-zinc-700/80 bg-black/50 p-3 font-mono text-sm max-md:max-h-56">
          <div className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-500">explorer</div>
          {tree ? (
            <ul>
              <li>
                <a
                  href="#/"
                  className={`block rounded px-1 py-0.5 ${
                    route.type === "dir" && !route.path ? "bg-zinc-100 text-black" : "text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {REPO.name}/
                </a>
                <TreeChildren node={tree} depth={1} route={route} expanded={expanded} toggle={toggle} />
              </li>
            </ul>
          ) : (
            <div className="text-zinc-600">...</div>
          )}
        </nav>

        <div id="core-explorer-view" className="min-h-0 min-w-0 overflow-auto px-1 md:px-8 md:py-4 xl:px-12">
          <div className="mx-auto w-full max-w-[52rem] pb-12">{body}</div>
        </div>
      </div>
    </div>
  );
}
