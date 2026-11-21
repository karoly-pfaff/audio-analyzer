import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
    restoreMocks: true,
    unstubGlobals: true,
    testTimeout: 30000,
    include: ['sources/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['sources/**/*.ts'],
      exclude: ['sources/**/*.test.ts'],
      reporter: ['text', 'html', 'json-summary', 'json'],
      thresholds: { perFile: true, lines: 100, statements: 100, functions: 100, branches: 100 },
    },
  },
});
