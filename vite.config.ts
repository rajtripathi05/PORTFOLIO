import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import autoImport from "unplugin-auto-import/vite";
import path from "path";
import type { Plugin } from "vite";

// Preload the Latin Inter subset (used on Windows/Android; macOS/iOS use the system font).
const preloadFont = (): Plugin => ({
  name: "preload-inter",
  apply: "build",
  transformIndexHtml: {
    order: "post",
    handler(html, ctx) {
      const font = Object.keys(ctx.bundle ?? {}).find((f) => /inter-latin-wght-normal.*.woff2$/.test(f));
      if (!font) return html;
      return html.replace(
        "</head>",
        `  <link rel=\"preload\" href=\"/${font}\" as=\"font\" type=\"font/woff2\" crossorigin />
  </head>`
      );
    }
  }
});

// Absolute site URL for canonical/Open Graph tags: Netlify sets URL at build time;
// SITE_URL overrides it (e.g. a custom domain).
const SITE_URL = (process.env.SITE_URL || process.env.URL || "").replace(/\/$/, "");
const siteUrl = (): Plugin => ({
  name: "site-url",
  transformIndexHtml: {
    order: "pre",
    // Without a known URL (local builds), drop tags that must be absolute.
    handler: (html) =>
      SITE_URL
        ? html.replaceAll("%SITE_URL%", SITE_URL)
        : html
            .replace(/\s*<link rel="canonical"[^>]*>/, "")
            .replace(/\s*<meta property="og:url"[^>]*>/, "")
            .replaceAll("%SITE_URL%", "")
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },
  build: {
    rollupOptions: {
      output: {
        // Long-cached vendor chunks.
        manualChunks: (id) =>
          /node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)
            ? "react"
            : /node_modules[\\/]framer-motion[\\/]/.test(id)
              ? "motion"
              : undefined
      }
    }
  },
  plugins: [
    preloadFont(),
    siteUrl(),
    unocss(),
    react(),
    autoImport({
      imports: ["react"],
      dts: "src/auto-imports.d.ts",
      dirs: ["src/hooks", "src/stores", "src/components/**"]
    })
  ],
  resolve: {
    alias: {
      "~/": `${path.resolve(__dirname, "src")}/`
    }
  }
});
