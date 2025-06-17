import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';


export default defineConfig({
  plugins: [
    react(),
    createHtmlPlugin({
      minify: true, 
      inject: {
          data: {
          VITE_APP_GOOGLE_MAP_API_KEY: process.env.VITE_APP_GOOGLE_MAP_API_KEY,
        },
      },
    }),
  ],
  server: {
    proxy: {
      '/hub': {
        target: 'https://open.neis.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hub/, '/hub'),
        secure: false, 
      },
    },
  },
});