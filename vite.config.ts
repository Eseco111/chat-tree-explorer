import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/chat-tree-explorer/',    // 例如 '/chat-tree-explorer/'
});