import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "backup_v2_vite/**",
      "old_project_backup/**",
      "temp_repo/**",
      "node_modules/**",
      "next-env.d.ts"
    ],
  },
];

export default eslintConfig;
