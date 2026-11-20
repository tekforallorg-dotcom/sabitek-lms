import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 ships native flat configs, so the FlatCompat shim the
// project used with 15.x is no longer needed (and no longer works).
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored, minified third-party worker: not ours to lint.
    "public/pdf-worker/**",
  ]),
]);

export default eslintConfig;
