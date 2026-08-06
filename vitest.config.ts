import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Next.js resolves the bare "server-only" import via its own bundler to
      // gate client-vs-server code; outside Next's build it always throws, so
      // stub it out for tests.
      'server-only': path.resolve(__dirname, './vitest.server-only-stub.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
});
