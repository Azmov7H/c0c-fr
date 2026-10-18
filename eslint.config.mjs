import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// ─── Design-system guard (T08) ───────────────────────────────────────────────
// Raw palette classes (`text-emerald-500`) bypass the token layer, so they do not
// follow the theme, cannot be adjusted globally, and were how 99 ad-hoc colours
// accumulated. The rule scans string literals and template chunks — that covers
// className attributes, cva variant maps and cn() arguments, which is every way a
// Tailwind class is written here.
const RAW_PALETTE_CLASS =
  /\b(?:bg|text|border|ring|outline|shadow|from|via|to|fill|stroke|decoration|divide|caret|accent|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;

const designSystemPlugin = {
  rules: {
    "no-raw-palette-classes": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow raw Tailwind palette classes in favour of semantic tokens",
        },
        schema: [],
        messages: {
          raw: "Raw palette class '{{className}}' — use a semantic token instead (e.g. bg-success, text-muted-foreground, border-border). Tokens live in src/styles/globals.css.",
        },
      },
      create(context) {
        function check(node, value) {
          const match = RAW_PALETTE_CLASS.exec(value);
          if (match) {
            context.report({
              node,
              messageId: "raw",
              data: { className: match[0] },
            });
          }
        }
        return {
          Literal(node) {
            if (typeof node.value === "string") check(node, node.value);
          },
          TemplateElement(node) {
            check(node, node.value.raw);
          },
        };
      },
    },
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    plugins: { "design-system": designSystemPlugin },
    rules: {
      "design-system/no-raw-palette-classes": "error",
    },
  },
  {
    rules: {
      // An argument or variable prefixed with `_` is declared but intentionally
      // unread — e.g. the `(url, init)` signature of a vi.fn() fetch stub, where
      // the parameters exist only to type `mock.calls`. Treated as a warning
      // rather than an error so the intent stays visible in review.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
