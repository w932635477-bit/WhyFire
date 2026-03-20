import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      ".claude/worktrees/**",
      "**/*.spec.ts", // Exclude Playwright e2e tests
    ],
    deps: {
      // 将 web-audio-beat-detector 标记为外部依赖，由 vitest 模拟
      external: [/web-audio-beat-detector/],
    },
    server: {
      deps: {
        inline: [],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
