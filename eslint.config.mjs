import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "vitest.config.ts", "vitest.setup.ts"],
  },
  {
    // This codebase predates lint being set up at all. `any` and unused
    // vars are real debt worth cleaning up over time, but downgrading them
    // to warnings lets CI catch new correctness bugs (hooks misuse, JSX
    // escaping, etc.) without blocking on the full backlog at once.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];

export default eslintConfig;
