import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// Lấy version từ environment variable hoặc fallback
const version = process.env.VERSION || '1.0.0';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: 'Duolingo DuoFarmer',
        namespace: 'https://duo-farmer.vercel.app',
        version: version,  // Sử dụng biến thay vì hardcode
        description: {
          ""  :'DuoFarmer is a tool that helps you farm XP, farm Streak, farm Gems or even repair frozen streak on Duolingo!.',
          'en': 'DuoFarmer is a tool that helps you farm XP, farm Streak, farm Gems or even repair frozen streak on Duolingo!.',
          'ar': 'DuoFarmer هي أداة تساعدك على تجميع نقاط الخبرة (XP) والسلاسل والجواهر أو حتى إصلاح سلسلة متجمدة على Duolingo!.',
          'bg': 'DuoFarmer е инструмент, който ви помага да фармите XP, серии, скъпоценни камъни или дори да поправяте замразени серии в Duolingo!.',
          'bn': 'DuoFarmer এমন একটি টুল যা আপনাকে Duolingo-তে XP, Streak, Gems ফার্ম করতে বা এমনকি জমে থাকা Streak মেরামত করতে সাহায্য করে!.',
          'cs': 'DuoFarmer je nástroj, který vám pomůže farmit XP, série, drahokamy nebo dokonce opravit zamrzlou sérii na Duolingu!.',
          'da': 'DuoFarmer er et værktøj, der hjælper dig med at farme XP, Streaks, Gems eller endda reparere en frossen streak på Duolingo!.',
          'de': 'DuoFarmer ist ein Tool, das Ihnen hilft, XP zu farmen, Streaks zu farmen, Edelsteine zu farmen oder sogar eingefrorene Streaks auf Duolingo zu reparieren!.',
          'el': 'Το DuoFarmer είναι ένα εργαλείο που σας βοηθά να φαρμάρετε XP, σερί, πετράδια ή ακόμα και να επισκευáσετε ένα παγωμένο σερί στο Duolingo!.',
          'es': 'DuoFarmer es una herramienta que te ayuda a farmear XP, Rachas, Gemas ¡o incluso reparar una racha congelada en Duolingo!.',
          'fi': 'DuoFarmer on työkalu, joka auttaa sinua farmaamaan XP:tä, putkia, jalokiviä tai jopa korjaamaan jäätyneen putken Duolingossa!.',
          'fr': 'DuoFarmer est un outil qui vous aide à farmer de l\'XP, des Séries, des Gemmes ou même à réparer une série gelée sur Duolingo !.',
          'he': 'DuoFarmer הוא כלי שעוזר לך לצבור XP, רצפים, אבני חן או אפילו לתקן רצף קפוא ב-Duolingo!.',
          'hi': 'DuoFarmer एक उपकरण है जो आपको Duolingo पर XP, स्ट्रीक, जेम्स फार्म करने या जमी हुई स्ट्रीक की मरम्मत करने में मदद करता है!.',
          'hu': 'A DuoFarmer egy eszköz, amely segít XP-t, sorozatokat, drágaköveket farmolni, vagy akár egy befagyott sorozatot is megjavítani a Duolingón!.',
          'id': 'DuoFarmer adalah alat yang membantu Anda farming XP, Streak, Permata, atau bahkan memperbaiki streak yang dibekukan di Duolingo!.',
          'it': 'DuoFarmer è uno strumento che ti aiuta a farmare XP, Serie, Gemme o persino a riparare una serie congelata su Duolingo!.',
          'ja': 'DuoFarmerは、DuolingoでXP、連続記録、ジェムを稼いだり、凍結された連続記録を修復したりするのに役立つツールです！.',
          'ko': 'DuoFarmer는 듀오링고에서 XP, 연속 학습, 보석을 파밍하거나 얼어붙은 연속 학습을 수리하는 데 도움이 되는 도구입니다!.',
          'ms': 'DuoFarmer ialah alat yang membantu anda mendapatkan XP, Streak, Permata atau bahkan membaiki streak yang beku di Duolingo!.',
          'nl': 'DuoFarmer is een tool die je helpt XP te farmen, Streaks te farmen, Edelstenen te farmen of zelfs een bevroren streak op Duolingo te repareren!.',
          'no': 'DuoFarmer er et verktøy som hjelper deg med å farme XP, Streaks, Gems eller til og med reparere en frossen streak på Duolingo!.',
          'pl': 'DuoFarmer to narzędzie, które pomaga farmić PD, Dni z rzędu, Klejnoty, a nawet naprawiać zamrożone Dni z rzędu na Duolingo!.',
          'pt-BR': 'DuoFarmer é uma ferramenta que te ajuda a farmar XP, Sequências, Gemas ou até mesmo reparar uma sequência congelada no Duolingo!.',
          'ro': 'DuoFarmer este un instrument care te ajută să farmezi XP, serii, nestemate sau chiar să repari o serie înghețată pe Duolingo!.',
          'ru': 'DuoFarmer — это инструмент, который помогает вам фармить опыт, серии, самоцветы и даже восстанавливать замороженные серии в Duolingo!.',
          'sv': 'DuoFarmer är ett verktyg som hjälper dig att farma XP, Streaks, Ädelstenar eller till och med reparera en frusen streak på Duolingo!.',
          'th': 'DuoFarmer เป็นเครื่องมือที่ช่วยให้คุณฟาร์ม XP, ฟาร์ม Streak, ฟาร์ม Gems หรือแม้แต่ซ่อมแซม Streak ที่ถูกแช่แข็งบน Duolingo!.',
          'tr': 'DuoFarmer, Duolingo\'da XP kasmanıza, Serileri kasmanıza, Mücevherleri kasmanıza ve hatta donmuş bir seriyi onarmanıza yardımcı olan bir araçtır!.',
          'uk': 'DuoFarmer — це інструмент, який допомагає вам фармити досвід, серії, самоцвіти та навіть відновлювати заморожені серії в Duolingo!.',
          'vi': 'DuoFarmer là một công cụ giúp bạn cày XP, cày Streak, cày Gems hoặc thậm chí phá băng streak bị đóng băng trên Duolingo!.',
          'zh-CN': 'DuoFarmer 是一款可以帮助您在 Duolingo 上刷经验值、刷连续记录、刷宝石，甚至修复冻结的连续记录的工具！.',
          'zh-TW': 'DuoFarmer 是一款可以幫助您在 Duolingo 上刷經驗值、刷連續記錄、刷寶石，甚至修復凍結的連續記錄的工具！.'
        },
        author: 'Lamduck',
        match: ['https://*.duolingo.com/*'],
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=duolingo.com',
        grant: ['GM_log'],
        license: 'CC BY-NC-SA 4.0',
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


