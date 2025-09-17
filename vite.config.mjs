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
        description: '[ MINIMAL UI ] DuoFarmer is a tool that helps you earn XP in Duolingo at blazing speed.',
        author: 'Lamduck',
        match: ['https://*.duolingo.com/*'],
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=duolingo.com',
        grant: ['none'],
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


