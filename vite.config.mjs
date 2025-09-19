import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: 'DuoFarmer',
        namespace: 'https://duo-farmer.vercel.app',
        version: '1.3',
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


