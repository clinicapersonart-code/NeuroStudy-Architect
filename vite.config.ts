import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Cast process to any to avoid TS errors with cwd() in some environments
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    root: '.',
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'client/src'),
      },
    },
    publicDir: 'client/public',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    // CRITICAL: Inject env vars into client code for production
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env': JSON.stringify(env)
    }
  };
});