import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// Lấy version từ environment variable hoặc fallback
const version = process.env.VERSION || '1.0.0';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: 'DuoFarmer',
        namespace: 'https://duo-farmer.vercel.app',
        version: version,  // Sử dụng biến thay vì hardcode
        description: 'DuoFarmer is a tool that helps you farm XP, farm Streak, farm Gems or even repair frozen streak on Duolingo!.',
        author: 'Lamduck',
        match: ['https://*.duolingo.com/*'],
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=duolingo.com',
        grant: ['GM_log'],
        license: 'none',
      },
      build: {
        fileName: 'duofarmer.user.js',
      },
      server: {
        open: false,
      },
    }),
  ],
  
});


