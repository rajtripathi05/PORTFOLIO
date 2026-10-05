import { defineConfig, presetIcons, presetUno, transformerDirectives, transformerVariantGroup } from "unocss";

// The theme only points at design tokens (src/styles/tokens.css), so light/dark,
// reduced motion and reduced transparency are handled in one place.
export default defineConfig({
  theme: {
    colors: {
      accent: {
        DEFAULT: "var(--accent)",
        hover: "var(--accent-hover)",
        active: "var(--accent-active)",
        text: "var(--accent-text)",
        soft: "var(--accent-subtle)"
      },
      "on-accent": "var(--on-accent)",
      "on-media": "var(--on-media)",
      ink: {
        1: "var(--text-1)",
        2: "var(--text-2)",
        3: "var(--text-3)"
      },
      panel: {
        DEFAULT: "var(--surface)",
        2: "var(--surface-2)",
        3: "var(--surface-3)",
        4: "var(--surface-4)"
      },
      hairline: "var(--hairline)",
      media: {
        control: "var(--media-control)",
        "control-hover": "var(--media-control-hover)",
        chip: "var(--media-chip)"
      },
      scrim: {
        DEFAULT: "var(--scrim)",
        light: "var(--scrim-light)",
        strong: "var(--scrim-strong)"
      },
      success: "var(--success)",
      danger: "var(--danger)",
      file: { pdf: "var(--file-pdf)", folder: "var(--folder)", star: "var(--folder-star)" },
      cat: {
        1: "var(--cat-1)",
        2: "var(--cat-2)",
        3: "var(--cat-3)",
        4: "var(--cat-4)",
        5: "var(--cat-5)",
        6: "var(--cat-6)"
      }
    },
    fontSize: {
      caption: ["var(--text-caption)", "var(--lh-caption)"],
      footnote: ["var(--text-footnote)", "var(--lh-footnote)"],
      body: ["var(--text-body)", "var(--lh-body)"],
      callout: ["var(--text-callout)", "var(--lh-callout)"],
      headline: ["var(--text-headline)", "var(--lh-headline)"],
      title: ["var(--text-title)", "var(--lh-title)"],
      large: ["var(--text-large)", "var(--lh-large)"]
    },
    borderRadius: {
      window: "var(--radius-window)",
      card: "var(--radius-card)",
      button: "var(--radius-button)",
      chip: "var(--radius-chip)",
      sm: "var(--radius-sm)",
      panel: "var(--radius-panel)"
    },
    boxShadow: {
      resting: "var(--shadow-resting)",
      raised: "var(--shadow-raised)",
      window: "var(--shadow-window)",
      overlay: "var(--shadow-window-focus)"
    },
    duration: {
      micro: "var(--duration-micro)",
      standard: "var(--duration-standard)",
      emphasis: "var(--duration-emphasis)"
    },
    easing: {
      standard: "var(--ease-standard)",
      spring: "var(--ease-spring)"
    }
  },
  shortcuts: [
    ["flex-center", "flex items-center justify-center"],
    ["hstack", "flex items-center"],
    ["vstack", "hstack flex-col"],
    [
      "btn",
      "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-button text-body font-semibold whitespace-nowrap select-none transition duration-micro ease-standard active:scale-[.97]"
    ],
    ["btn-primary", "btn bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-active"],
    ["btn-secondary", "btn bg-panel text-ink-1 border border-hairline hover:bg-panel-3 shadow-resting"],
    ["btn-ghost", "btn text-accent-text hover:bg-accent-soft"],
    ["btn-sm", "h-8 px-3 text-footnote"],
    ["btn-lg", "h-11 px-5 text-callout"],
    ["btn-disabled", "btn bg-panel-2 text-ink-3 border border-dashed border-hairline cursor-not-allowed active:scale-100"],
    ["btn-media", "btn bg-media-control text-on-media hover:bg-media-control-hover"]
  ],
  presets: [
    presetUno(),
    presetIcons({
      warn: true,
      // Registered explicitly: auto-discovery of @iconify-json/* fails on this toolchain.
      collections: {
        ph: () => import("@iconify-json/ph/icons.json").then((i) => i.default as any)
      },
      extraProperties: {
        display: "inline-block",
        "vertical-align": "middle",
        "flex-shrink": "0"
      }
    })
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()]
});
