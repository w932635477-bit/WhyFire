import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts", "./tests/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}", "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      ".claude/worktrees/**",
      "**/*.spec.ts", // Exclude Playwright e2e tests (they use different runner)
    ],
    // 分层测试配置
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: process.env.E2E_REAL === "true",  // 真实 E2E 用单线程
      },
    },
    timeout: process.env.E2E_REAL === "true" ? 300000 : 30000,  // 真实 E2E 5分钟超时
    // 覆盖率配置
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      // 覆盖率阈值 - 目标 80%
      thresholds: {
        lines: 60,           // 当前目标 60%，逐步提升到 80%
        functions: 50,
        branches: 50,
        statements: 60,
      },
      // 排除不需要测试的文件
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types/**",
        "src/test/**",
        "scripts/**",
        ".next/**",
        // 生成的文件
        "src/app/api/**/route.ts",  // API 路由暂时排除
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/tests": path.resolve(__dirname, "./tests"),
    },
  },
})
