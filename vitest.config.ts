// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/__tests__/**/*.{test,spec}.ts?(x)'],
    exclude: [
      'e2e/**',
      'node_modules/**',
      '.next/**',
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**'
    ],
    environment: 'node',

    // Use vmThreads to avoid tinypool path resolution issues
    pool: 'vmThreads',
    poolOptions: {
      vmThreads: {
        singleThread: true,
      },
    },

    // Nice-to-haves
    globals: true,
    clearMocks: true,
    reporters: ['default'],
  },
})
