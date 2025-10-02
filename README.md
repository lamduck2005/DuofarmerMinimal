# Duolingo DuoFarmer 🐸

## Description

DuoFarmer is a powerful tool that helps you automatically farm XP, Gems, and Streaks on Duolingo! Whether you want to boost your experience points, collect gems for rewards, or repair frozen streaks, DuoFarmer has you covered.

### Key Features:
- 🚀 **Gem Farming**: Farm 30 gems per session
- 📈 **XP Session Farming**: Safe XP farming (10-110 XP) - works with any language
- ⚡ **XP Story Farming**: Fast XP farming (50-499 XP) - English course only, use with caution
- 🔥 **Streak Farming**: Repair frozen streaks automatically
- ⚙️ **Customizable Settings**:
  - Adjustable delay and retry times (100-10000ms)
  - Auto-stop timer (minutes)
  - Auto-start farming on page load
  - Auto-open UI
  - Default farming option selection
  - Keep screen awake during farming
  - Username hiding for privacy
  - Account privacy toggle (public/private)
- 🎨 **User-Friendly Interface**: Clean, responsive UI with floating button
- 🔒 **Secure**: Uses your existing JWT token, no account compromise

### Safety Warning:
- **Use secondary accounts** for farming to avoid bans
- **Limited use of Story Farming** - it's fast but risky
- **Monitor your account** regularly
- The developer is not responsible for any account issues

## License & Usage Note

This script is open-source and licensed under the **Creative Commons BY-NC-SA 4.0** license. This means you are free to copy, modify, and share this script, but you must adhere to the following conditions:

- **Attribution**: You must give appropriate credit to the original author and link back to the script's homepage.
- **NonCommercial**: You may not use this script or any derivative works for commercial purposes.
- **ShareAlike**: If you create a new version based on this script, you must distribute it under the same CC BY-NC-SA 4.0 license.

## Links:
- **Homepage**: https://duo-farmer.vercel.app
- **Telegram Group**: [@duofarmer](https://t.me/duofarmer)
- **License**: [Creative Commons BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- A userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.org/)

### Development Setup
1. Clone the repository:
```bash
git clone https://github.com/lamduck2005/DuofarmerMinimal.git
cd DuofarmerMinimal
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

The built userscript will be available at `dist/duofarmer.user.js`

### Installation
1. Install a userscript manager (Tampermonkey/Greasemonkey)
2. Open the userscript manager and create a new script
3. Copy the contents of `dist/duofarmer.user.js` and paste it into the script
4. Save the script
5. Visit Duolingo and log in
6. The floating DuoFarmer button should appear

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production userscript
- `npm run preview` - Preview the built userscript

---

## Project Structure
```
DuofarmerMinimal/
├── src/
│   ├── main.js           # Main application logic
│   ├── main.html         # UI template
│   ├── main.css          # Styles
│   ├── service/
│   │   └── api.js        # Duolingo API service
│   ├── settings/
│   │   └── settings-manager.js  # Settings management
│   └── utils/
│       └── utils.js      # Utility functions
├── dist/                 # Built files
├── package.json
├── vite.config.mjs       # Vite configuration
└── README.md
```

## Contributing
This project welcomes contributions. Please read the license terms before contributing.

## Disclaimer
This tool is for educational purposes only. Use at your own risk. The developer is not responsible for any consequences resulting from the use of this software.