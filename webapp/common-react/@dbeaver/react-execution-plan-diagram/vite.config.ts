import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/standalone.ts',
      output: {
        entryFileNames: 'execution-plan-diagram.js',
        assetFileNames: 'execution-plan-diagram.[ext]',
      },
    },
  },
});
