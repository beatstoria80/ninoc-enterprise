import { dirname } from "path";
import { fileURLToPath } from "url";
import nextConfig from "eslint-config-next";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "backup_v2_vite/**",
      "node_modules/**",
    ],
  },
  ...nextConfig.map((config) => ({
    ...config,
    settings: {
      ...config.settings,
      next: {
        ...config.settings?.next,
        rootDir: __dirname,
      },
    },
  })),
];

export default eslintConfig;
