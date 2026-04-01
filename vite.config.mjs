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
        description: {
          '': 'DuoFarmer is a helper for farm XP, Streak, Gems and more features!!!',
          en: 'DuoFarmer is a helper for farm XP, Streak, Gems and more features!!!',
          ar: 'DuoFarmer هي أداة مساعدة لكسب نقاط الخبرة (XP) والسلاسل والجواهر والمزيد من الميزات!!!',
          bg: 'DuoFarmer е помощник за фармене на XP, серии, скъпоценни камъни и още функции!!!',
          bn: 'DuoFarmer হলো XP, Streak, Gems ফার্ম করার এবং আরও অনেক ফিচারের জন্য একটি সহায়ক টুল!!!',
          cs: 'DuoFarmer je pomocník pro farmení XP, sérií, drahokamů a dalších funkcí!!!',
          da: 'DuoFarmer er en hjælper til at farme XP, Streaks, Gems og flere funktioner!!!',
          de: 'DuoFarmer ist ein Helfer zum Farmen von XP, Streaks, Edelsteinen und weiteren Funktionen!!!',
          el: 'Το DuoFarmer είναι βοηθός για farming XP, σερί, πετράδια και περισσότερες λειτουργίες!!!',
          es: 'DuoFarmer es un asistente para farmear XP, Rachas, Gemas y más funciones!!!',
          fi: 'DuoFarmer on apuväline XP:n, putkien, jalokivien ja lisätoimintojen farmaamista varten!!!',
          fr: "DuoFarmer est un assistant pour farmer l'XP, les Séries, les Gemmes et bien d'autres fonctionnalités!!!",
          he: 'DuoFarmer הוא עוזר לצבירת XP, רצפים, אבני חן ועוד תכונות!!!',
          hi: 'DuoFarmer, XP, Streak, Gems फार्म करने और अधिक सुविधाओं के लिए एक सहायक है!!!',
          hu: 'A DuoFarmer egy segítő az XP, sorozatok, drágakövek farmolásához és még több funkcióhoz!!!',
          id: 'DuoFarmer adalah asisten untuk farming XP, Streak, Gems dan fitur lainnya!!!',
          it: 'DuoFarmer è un assistente per farmare XP, Serie, Gemme e altre funzionalità!!!',
          ja: 'DuoFarmerはXP、連続記録、ジェムのファームやその他の機能を助けるツールです!!!',
          ko: 'DuoFarmer는 XP, Streak, Gems 파밍과 더 많은 기능을 위한 도우미입니다!!!',
          ms: 'DuoFarmer ialah pembantu untuk farming XP, Streak, Gems dan ciri-ciri lain!!!',
          nl: 'DuoFarmer is een helper voor het farmen van XP, Streaks, Edelstenen en meer functies!!!',
          no: 'DuoFarmer er en hjelper for å farme XP, Streaks, Gems og flere funksjoner!!!',
          pl: 'DuoFarmer to pomocnik do farmienia XP, serii, klejnotów i wielu innych funkcji!!!',
          'pt-BR': 'DuoFarmer é um assistente para farmar XP, Sequências, Gemas e mais recursos!!!',
          ro: 'DuoFarmer este un asistent pentru a farma XP, serii, nestemate și mai multe funcții!!!',
          ru: 'DuoFarmer — это помощник для фарма опыта, серий, самоцветов и других функций!!!',
          sv: 'DuoFarmer är en hjälpare för att farma XP, Streaks, Ädelstenar och fler funktioner!!!',
          th: 'DuoFarmer เป็นตัวช่วยสำหรับการฟาร์ม XP, Streak, Gems และฟีเจอร์อื่นๆ อีกมากมาย!!!',
          tr: 'DuoFarmer, XP kasması, Seri kasması, Mücevher kasması ve daha fazla özellik için bir yardımcıdır!!!',
          uk: 'DuoFarmer — це помічник для фарму досвіду, серій, самоцвітів та інших функцій!!!',
          vi: 'DuoFarmer là một công cụ hỗ trợ cày XP, Streak, Gems và nhiều tính năng khác!!!',
          'zh-CN': 'DuoFarmer 是一款帮助你刷经验值、连续记录、宝石以及更多功能的工具!!!',
          'zh-TW': 'DuoFarmer 是一款幫助你刷經驗值、連續記錄、寶石以及更多功能的工具!!!',
        },
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
