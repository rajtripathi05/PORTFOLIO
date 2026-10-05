import {
  defineConfig,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

export default defineConfig({
  // Colours come from CSS variables in src/styles/theme.css, so light/dark is automatic.
  theme: {
    colors: {
      accent: {
        DEFAULT: "var(--accent)",
        hover: "var(--accent-hover)",
        text: "var(--accent-text)",
        soft: "var(--accent-soft)"
      },
      ink: {
        1: "var(--text-1)",
        2: "var(--text-2)",
        3: "var(--text-3)"
      },
      panel: {
        DEFAULT: "var(--panel)",
        2: "var(--panel-2)",
        3: "var(--panel-3)"
      },
      hairline: "var(--hairline)"
    }
  },
  shortcuts: [
    ["flex-center", "flex items-center justify-center"],
    ["hstack", "flex items-center"],
    ["vstack", "hstack flex-col"],
    [
      "btn",
      "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-[14px] font-semibold whitespace-nowrap select-none transition-colors duration-150"
    ],
    ["btn-primary", "btn bg-accent text-white hover:bg-accent-hover"],
    [
      "btn-secondary",
      "btn bg-panel text-ink-1 border border-hairline hover:bg-panel-3 shadow-sm"
    ],
    ["btn-ghost", "btn text-accent-text hover:bg-accent-soft"],
    ["btn-sm", "h-8 px-3 text-[13.5px]"],
    ["btn-lg", "h-11 px-5 text-[15px]"],
    [
      "btn-disabled",
      "btn bg-panel-2 text-ink-3 border border-dashed border-hairline cursor-not-allowed"
    ]
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
  transformers: [
    transformerDirectives(),
    transformerVariantGroup()
  ]
});
