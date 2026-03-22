import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

// Lấy version từ environment variable hoặc fallback
const version = process.env.VERSION || "1.0.0";

export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.js",
      userscript: {
        name: "Duolingo DuoFarmer",
        namespace: "https://www.duolingo.com/",
        version: version, // Sử dụng biến thay vì hardcode
        description: "DuoFarmer is a helper for farm XP, Streak, Gems and more features!!!",
        author: "Lamduck",
        match: ["https://*.duolingo.com/*"],
        icon: "https://www.google.com/s2/favicons?sz=64&domain=duolingo.com",
        grant: ["GM_log"],
        license: "CC BY-NC-SA 4.0",
        antifeature: {
          type: 'ads',
          description: 'This script have link to my Telegram group and some other link.'
        }
      },
      build: {
        fileName: "duofarmer.user.js",
      },
      server: {
        open: false,
        mountGmApi: true
      },
    }),
  ],
});
