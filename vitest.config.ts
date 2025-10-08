// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  root: path.resolve(__dirname),
  test: {
    include: ['**/__tests__/**/*.{test,spec}.ts?(x)'],
    exclude: [
      'e2e/**',           // <-- keep Playwright tests out of Vitest
      'node_modules/**',
      '.next/**',
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**'
    ],
    environment: 'node',
    pool: 'forks'
  }
})
