import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/__tests__/**/*.{test,spec}.ts?(x)', '**/*.{test,spec}.ts?(x)'],
    exclude: [
      'e2e/**',
      'node_modules/**',
      '.next/**',
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'data/**',
    ],
    environment: 'node',
    // Disable threading entirely to avoid tinypool issues
    threads: false,
    // Nice-to-haves for stability
    globals: true,
    clearMocks: true,
    reporters: ['basic'],
  },
});
