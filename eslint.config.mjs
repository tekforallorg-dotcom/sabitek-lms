import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 ships native flat configs, so the FlatCompat shim the
// project used with 15.x is no longer needed (and no longer works).
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Known debt, reported as warnings rather than errors.
    //
    // CI runs `npm run lint`, which fails on ANY error and also fails if the
    // number of warnings rises above the baseline in package.json
    // (--max-warnings). So this debt cannot grow: new code must be clean, and
    // when you fix warnings, lower the baseline to match.
    //
    // - no-explicit-any: about 250 uses of `any`, mostly on query results that
    //   predate the generated database types.
    // - the React Compiler rules (immutability, set-state-in-effect, purity,
    //   refs): about 150 findings in client pages that are due to be rebuilt
    //   as server components. They flag real patterns, not style.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
    },
  },
  {
    // CommonJS config files legitimately use require().
    files: ["*.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored, minified third-party worker: not ours to lint.
    "public/pdf-worker/**",
    // Generated from the database; regenerate instead of editing.
    "types/supabase.ts",
  ]),
]);

export default eslintConfig;
