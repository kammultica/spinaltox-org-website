import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // GitHub Pages（プロジェクトページ/独自ドメインどちらでも）で動くよう相対パスで出力
  base: "./",
  plugins: [react(), tailwindcss()],
});
