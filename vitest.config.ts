import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dev-references/**',
      ],
      /**
       * Enforced per glob rather than globally.
       *
       * The 80% rule is meaningful for the pure modules below, which are
       * unit-testable end to end. A single global gate would instead fail on
       * `storyblok.ts`, `shopClient.ts` and `galleryApi.ts` — thin network
       * wrappers with no tests, unrelated to anything these thresholds are
       * meant to protect — and a gate that fails for unrelated reasons gets
       * switched off rather than fixed.
       *
       * Raise the scope as other modules gain tests; do not lower these.
       */
      thresholds: {
        'src/lib/event*.ts': {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
        'src/lib/storyblokImage.ts': {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
        'src/utils/**/*.ts': {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },
  },
});
