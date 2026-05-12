import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "backup_v2_vite/**",
    "old_project_backup/**",
    "temp_repo/**",
    "node_modules/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
