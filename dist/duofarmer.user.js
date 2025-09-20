// ==UserScript==
// @name         DuoFarmer
// @namespace    https://duo-farmer.vercel.app
// @version      1.3.1
// @author       Lamduck
// @description  DuoFarmer is a tool that helps you farm XP, farm Streak, farm Gems or even repair frozen streak on Duolingo!.
// @license      none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=duolingo.com
// @match        https://*.duolingo.com/*
// @grant        GM_log
// ==/UserScript==

(function () {
  'use strict';

  const templateRaw = '<div id="overlay"></div>\r\n<div id="container">\r\n  <div id="header">\r\n    <span class="label">Duofarmer minimal UI</span>\r\n  </div>\r\n  <div id="body">\r\n    <table id="table-main" class="table">\r\n      <thead>\r\n        <tr>\r\n          <th>Username</th>\r\n          <th>From</th>\r\n          <th>Learning</th>\r\n        </tr>\r\n      </thead>\r\n      <tbody>\r\n        <tr>\r\n          <td id="username">duofarmer</td>\r\n          <td id="from">any</td>\r\n          <td id="learn">any</td>\r\n        </tr>\r\n      </tbody>\r\n    </table>\r\n    <table id="table-progress" class="table">\r\n      <thead>\r\n        <tr>\r\n          <th>Streak</th>\r\n          <th>Gem</th>\r\n          <th>XP</th>\r\n        </tr>\r\n      </thead>\r\n      <tbody>\r\n        <tr>\r\n          <td id="streak">0</td>\r\n          <td id="gem">0</td>\r\n          <td id="xp">0</td>\r\n        </tr>\r\n      </tbody>\r\n    </table>\r\n    <div id="action-row">\r\n      <select id="select-option">\r\n        <!-- <option value="option1">Option 1</option> -->\r\n        <!-- <option value="option2">Option 2</option> -->\r\n      </select>\r\n      <button id="start-btn">Start</button>\r\n      <button id="stop-btn" hidden>Stop</button>\r\n    </div>\r\n    <div id="notify">High ban risk! Use with caution.<br /></div>\r\n    <a id="blank-page-link" href="https://www.duolingo.com/errors/404.html"\r\n      >Blank page (click here)</a\r\n    >\r\n  </div>\r\n  <div id="footer">\r\n    <a href="https://greasyfork.org/vi/scripts/528621-duofarmer" target="_blank"\r\n      >Greasyfork</a\r\n    >\r\n    <a href="https://t.me/duofarmer" target="_blank">Telegram</a>\r\n    <a href="https://duo-farmer.vercel.app" target="_blank">Homepage</a>\r\n  </div>\r\n</div>\r\n<div id="floating-btn">🐸</div>\r\n';
  const cssText = "#container{width:90vw;max-width:800px;min-height:40vh;max-height:90vh;background:#222;color:#fff;border-radius:10px;box-shadow:0 2px 12px #0008;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999}#header{height:60px;background:#333;display:flex;align-items:center;justify-content:center;border-top-left-radius:10px;border-top-right-radius:10px;width:100%}#body{min-height:40vh;max-height:100%;min-width:0;background:#282828;display:flex;align-items:center;justify-content:center;width:100%;overflow-y:auto;flex:1;flex-direction:column}#footer{height:50px;background:#222;display:flex;align-items:center;justify-content:space-evenly;border-bottom-left-radius:10px;border-bottom-right-radius:10px;width:100%}.label{font-size:1em}#header .label{font-size:1.5em;font-style:italic;font-weight:700;color:#fac8ff}#body .label{font-size:1.2em}.table{width:100%;background:#232323;color:#fff;border-radius:8px;padding:8px 12px;text-align:center;table-layout:fixed}.table th,.table td{padding:9px 12px;text-align:center;border-bottom:1px solid #444;width:1%}.table tbody tr:last-child td{border-bottom:none}#body h3{margin:0;color:#fff;font-size:1.1em;font-weight:700;letter-spacing:1px}#action-row{width:90%;display:flex;justify-content:space-between;align-items:center;margin:8px 0;gap:8px}#select-option{width:90%;max-width:90%;margin-right:8px;padding:8px 12px;border-radius:6px;border:1px solid #444;background:#232323;color:#fff;font-size:1em;outline:none}#start-btn,#stop-btn{width:auto;margin-left:0;padding:8px 18px;border-radius:6px;border:none;background:#229100;color:#fff;font-size:1em;font-weight:700;cursor:pointer;box-shadow:0 2px 8px #0003}#stop-btn{background:#af0303}.disable-btn{background:#52454560!important;cursor:not-allowed!important}#notify{width:90%;max-width:90%;min-height:10vh;margin:8px 0;padding:8px 12px;border-radius:6px;background:#333;color:#c8ff00;font-size:1em;word-wrap:break-word}#blank-page-link{margin-bottom:8px;color:#fce6ff;font-weight:700;font-style:italic}#footer a,#footer span{text-decoration:none;color:#00aeff;font-size:1em;font-weight:700;font-style:italic}#overlay{position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000c;z-index:9998;pointer-events:all}#floating-btn{position:fixed;bottom:10%;right:2%;width:40px;height:40px;background:#35bd00;border-radius:50%;box-shadow:0 2px 8px #0000004d;z-index:10000;cursor:pointer;display:flex;align-items:center;justify-content:center}.hidden{display:none}";
  const log = (message) => {
    if (typeof GM_log !== "undefined") {
      GM_log(message);
    } else {
      console.log("[DuoFarmer]", message);
    }
  };
  const logError = (error, context = "") => {
    const message = (error == null ? void 0 : error.message) || (error == null ? void 0 : error.toString()) || "Unknown error";
    const fullMessage = context ? `[${context}] ${message}` : message;
    log(fullMessage);
  };
  const delay = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
  const toTimestamp = (dateStr) => {
    return Math.floor(new Date(dateStr).getTime() / 1e3);
  };
  const getCurrentUnixTimestamp = () => {
    return Math.floor(Date.now() / 1e3);
  };
  const getJwtToken = () => {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith("jwt_token=")) {
        return cookie.substring("jwt_token=".length);
      }
    }
    return null;
  };
  const decodeJwtToken = (token) => {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64).split("").map(function(c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      }).join("")
    );
    return JSON.parse(jsonPayload);
  };
  const formatHeaders = (jwtToken) => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwtToken}`,
      "User-Agent": navigator.userAgent
    };
  };
  class ApiService {
    constructor(jwt2, defaultHeaders2, userInfo2, sub2) {
      this.jwt = jwt2;
      this.defaultHeaders = defaultHeaders2;
      this.userInfo = userInfo2;
      this.sub = sub2;
    }
    static async getUserInfo(userSub, headers) {
      const userInfoUrl = `https://www.duolingo.com/2017-06-30/users/${userSub}?fields=id,username,fromLanguage,learningLanguage,streak,totalXp,level,numFollowers,numFollowing,gems,creationDate,streakData`;
      const response = await fetch(userInfoUrl, { method: "GET", headers });
      return await response.json();
    }
    async sendRequest({ url, payload, headers, method = "PUT" }) {
      try {
        const res = await fetch(url, {
          method,
          headers,
          body: payload ? JSON.stringify(payload) : void 0
        });
        return res;
      } catch (error) {
        return error;
      }
    }
    async farmGemOnce() {
      const idReward = "SKILL_COMPLETION_BALANCED-dd2495f4_d44e_3fc3_8ac8_94e2191506f0-2-GEMS";
      const patchUrl = `https://www.duolingo.com/2017-06-30/users/${this.sub}/rewards/${idReward}`;
      const patchData = {
        consumed: true,
        learningLanguage: this.userInfo.learningLanguage,
        fromLanguage: this.userInfo.fromLanguage
      };
      return await this.sendRequest({ url: patchUrl, payload: patchData, headers: this.defaultHeaders, method: "PATCH" });
    }
    async farmStoryOnce(config = {}) {
      const startTime = getCurrentUnixTimestamp();
      const fromLanguage = this.userInfo.fromLanguage;
      const completeUrl = `https://stories.duolingo.com/api2/stories/en-${fromLanguage}-the-passport/complete`;
      const payload = {
        awardXp: true,
        isFeaturedStoryInPracticeHub: false,
        completedBonusChallenge: true,
        mode: "READ",
        isV2Redo: false,
        isV2Story: false,
        isLegendaryMode: true,
        masterVersion: false,
        maxScore: 0,
        numHintsUsed: 0,
        score: 0,
        startTime,
        fromLanguage,
        learningLanguage: "en",
        hasXpBoost: false,
        // happyHourBonusXp: 449,
        ...config
      };
      return await this.sendRequest({ url: completeUrl, payload, headers: this.defaultHeaders, method: "POST" });
    }
    async farmSessionOnce(config = {}) {
      const startTime = config.startTime || getCurrentUnixTimestamp();
      const endTime = config.endTime || startTime + 60;
      const sessionPayload = {
        challengeTypes: [
          "assist",
          "characterIntro",
          "characterMatch",
          "characterPuzzle",
          "characterSelect",
          "characterTrace",
          "characterWrite",
          "completeReverseTranslation",
          "definition",
          "dialogue",
          "extendedMatch",
          "extendedListenMatch",
          "form",
          "freeResponse",
          "gapFill",
          "judge",
          "listen",
          "listenComplete",
          "listenMatch",
          "match",
          "name",
          "listenComprehension",
          "listenIsolation",
          "listenSpeak",
          "listenTap",
          "orderTapComplete",
          "partialListen",
          "partialReverseTranslate",
          "patternTapComplete",
          "radioBinary",
          "radioImageSelect",
          "radioListenMatch",
          "radioListenRecognize",
          "radioSelect",
          "readComprehension",
          "reverseAssist",
          "sameDifferent",
          "select",
          "selectPronunciation",
          "selectTranscription",
          "svgPuzzle",
          "syllableTap",
          "syllableListenTap",
          "speak",
          "tapCloze",
          "tapClozeTable",
          "tapComplete",
          "tapCompleteTable",
          "tapDescribe",
          "translate",
          "transliterate",
          "transliterationAssist",
          "typeCloze",
          "typeClozeTable",
          "typeComplete",
          "typeCompleteTable",
          "writeComprehension"
        ],
        fromLanguage: this.userInfo.fromLanguage,
        isFinalLevel: false,
        isV2: true,
        juicy: true,
        learningLanguage: this.userInfo.learningLanguage,
        smartTipsVersion: 2,
        type: "GLOBAL_PRACTICE"
      };
      const sessionRes = await this.sendRequest({ url: "https://www.duolingo.com/2017-06-30/sessions", payload: sessionPayload, headers: this.defaultHeaders, method: "POST" });
      const sessionData = await sessionRes.json();
      const updateSessionPayload = {
        ...sessionData,
        heartsLeft: 0,
        startTime,
        enableBonusPoints: false,
        endTime,
        failed: false,
        maxInLessonStreak: 9,
        shouldLearnThings: true,
        ...config
      };
      const updateRes = await this.sendRequest({ url: `https://www.duolingo.com/2017-06-30/sessions/${sessionData.id}`, payload: updateSessionPayload, headers: this.defaultHeaders, method: "PUT" });
      return updateRes;
    }
  }
  const DELAY = 500;
  const ERROR_DELAY = 1e3;
  let jwt, defaultHeaders, userInfo, sub, apiService;
  let isRunning = false;
  let shadowRoot = null;
  const OPTIONS = [
    { type: "separator", label: "═══════ GEM FARMING ═══════", value: "", disabled: true },
    { type: "gem", label: "Gem 30", value: "fixed", amount: 30 },
    { type: "separator", label: "═══════ XP SESSION FARMING ═══════", value: "", disabled: true },
    { type: "separator", label: "(slow but safe)", value: "", disabled: true },
    { type: "xp", label: "XP 10", value: "session", amount: 10, config: {} },
    { type: "xp", label: "XP 13", value: "session", amount: 13, config: { enableBonusPoints: true } },
    { type: "xp", label: "XP 20", value: "session", amount: 20, config: { hasBoost: true } },
    { type: "xp", label: "XP 26", value: "session", amount: 26, config: { enableBonusPoints: true, hasBoost: true } },
    { type: "xp", label: "XP 36", value: "session", amount: 36, config: { enableBonusPoints: true, hasBoost: true, happyHourBonusXp: 10 } },
    { type: "separator", label: "═══════ XP STORY FARMING ═══════", value: "", disabled: true },
    { type: "separator", label: "(fast, not safe, English only) ", value: "", disabled: true },
    { type: "xp", label: "XP 50", value: "story", amount: 0, config: {} },
    { type: "xp", label: "XP 90 ", value: "story", amount: 0, config: { hasXpBoost: true } },
    { type: "xp", label: "XP 100 ", value: "story", amount: 100, config: { happyHourBonusXp: 50 } },
    { type: "xp", label: "XP 200 ", value: "story", amount: 200, config: { happyHourBonusXp: 150 } },
    { type: "xp", label: "XP 300 ", value: "story", amount: 300, config: { happyHourBonusXp: 250 } },
    { type: "xp", label: "XP 400 ", value: "story", amount: 400, config: { happyHourBonusXp: 350 } },
    { type: "xp", label: "XP 499 ", value: "story", amount: 499, config: { happyHourBonusXp: 449 } },
    { type: "separator", label: "═══════ STREAK FARMING ═══════", value: "", disabled: true },
    { type: "streak", label: "Streak farm (test)", value: "farm" }
  ];
  const getElements = () => ({
    startBtn: shadowRoot.getElementById("start-btn"),
    stopBtn: shadowRoot.getElementById("stop-btn"),
    select: shadowRoot.getElementById("select-option"),
    floatingBtn: shadowRoot.getElementById("floating-btn"),
    container: shadowRoot.getElementById("container"),
    overlay: shadowRoot.getElementById("overlay"),
    notify: shadowRoot.getElementById("notify"),
    username: shadowRoot.getElementById("username"),
    from: shadowRoot.getElementById("from"),
    learn: shadowRoot.getElementById("learn"),
    streak: shadowRoot.getElementById("streak"),
    gem: shadowRoot.getElementById("gem"),
    xp: shadowRoot.getElementById("xp")
  });
  const setRunningState = (running) => {
    isRunning = running;
    const { startBtn, stopBtn, select } = getElements();
    if (running) {
      startBtn.hidden = true;
      stopBtn.hidden = false;
      stopBtn.disabled = true;
      stopBtn.className = "disable-btn";
      select.disabled = true;
    } else {
      stopBtn.hidden = true;
      startBtn.hidden = false;
      startBtn.disabled = true;
      startBtn.className = "disable-btn";
      select.disabled = false;
    }
    setTimeout(() => {
      const { startBtn: btn, stopBtn: stop } = getElements();
      btn.className = "";
      btn.disabled = false;
      stop.className = "";
      stop.disabled = false;
    }, 3e3);
  };
  const disableAllControls = (notifyMessage = null) => {
    const { startBtn, stopBtn, select } = getElements();
    startBtn.disabled = true;
    startBtn.className = "disable-btn";
    stopBtn.disabled = true;
    select.disabled = true;
    if (notifyMessage) {
      updateNotify(notifyMessage);
    }
  };
  const initInterface = () => {
    const container = document.createElement("div");
    shadowRoot = container.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = cssText;
    shadowRoot.appendChild(style);
    const content = document.createElement("div");
    content.innerHTML = templateRaw;
    shadowRoot.appendChild(content);
    document.body.appendChild(container);
    const requiredElements = [
      "start-btn",
      "stop-btn",
      "select-option",
      "floating-btn",
      "container",
      "overlay",
      "notify"
    ];
    for (const id of requiredElements) {
      if (!shadowRoot.getElementById(id)) {
        throw new Error(`Required UI element '${id}' not found in template. Template may be corrupted.`);
      }
    }
  };
  const setInterfaceVisible = (visible) => {
    const { container, overlay } = getElements();
    container.style.display = visible ? "flex" : "none";
    overlay.style.display = visible ? "block" : "none";
  };
  const isInterfaceVisible = () => {
    const { container } = getElements();
    return container.style.display !== "none" && container.style.display !== "";
  };
  const toggleInterface = () => {
    setInterfaceVisible(!isInterfaceVisible());
  };
  const addEventFloatingBtn = () => {
    const { floatingBtn } = getElements();
    floatingBtn.addEventListener("click", () => {
      if (isRunning) {
        if (confirm("Duofarmer is farming. Do you want to stop and hide UI?")) {
          setRunningState(false);
          setInterfaceVisible(false);
        }
        return;
      }
      toggleInterface();
    });
  };
  const addEventStartBtn = () => {
    const { startBtn, select } = getElements();
    startBtn.addEventListener("click", async () => {
      setRunningState(true);
      const selected = select.options[select.selectedIndex];
      const optionData = {
        type: selected.getAttribute("data-type"),
        amount: Number(selected.getAttribute("data-amount")),
        value: selected.value,
        label: selected.textContent,
        config: selected.getAttribute("data-config") ? JSON.parse(selected.getAttribute("data-config")) : {}
      };
      await farmSelectedOption(optionData);
    });
  };
  const addEventStopBtn = () => {
    const { stopBtn } = getElements();
    stopBtn.addEventListener("click", () => {
      setRunningState(false);
    });
  };
  const addEventListeners = () => {
    addEventFloatingBtn();
    addEventStartBtn();
    addEventStopBtn();
  };
  const populateOptions = () => {
    const select = shadowRoot.getElementById("select-option");
    select.innerHTML = "";
    OPTIONS.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      option.setAttribute("data-type", opt.type);
      if (opt.amount != null) option.setAttribute("data-amount", String(opt.amount));
      if (opt.config) option.setAttribute("data-config", JSON.stringify(opt.config));
      if (opt.disabled) option.disabled = true;
      select.appendChild(option);
    });
  };
  const updateNotify = (message) => {
    const { notify } = getElements();
    const now = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    notify.innerText = `[${now}] ` + message;
    log(`[${now}] ${message}`);
  };
  const updateUserInfo = () => {
    const { username, from, learn, streak, gem, xp } = getElements();
    if (userInfo) {
      username.innerText = userInfo.username;
      from.innerText = userInfo.fromLanguage;
      learn.innerText = userInfo.learningLanguage;
      streak.innerText = userInfo.streak;
      gem.innerText = userInfo.gems;
      xp.innerText = userInfo.totalXp;
    }
  };
  const updateFarmResult = (type, farmedAmount) => {
    switch (type) {
      case "gem":
        userInfo = { ...userInfo, gems: userInfo.gems + farmedAmount };
        updateNotify(`You got ${farmedAmount} gem!!!`);
        break;
      case "xp":
        userInfo = { ...userInfo, totalXp: userInfo.totalXp + farmedAmount };
        updateNotify(`You got ${farmedAmount} XP!!!`);
        break;
      case "streak":
        userInfo = { ...userInfo, streak: userInfo.streak + farmedAmount };
        updateNotify(`You got ${farmedAmount} streak! (maybe some xp too, idk)`);
        break;
    }
    updateUserInfo();
  };
  const gemFarmingLoop = async () => {
    const gemFarmed = 30;
    while (isRunning) {
      try {
        await apiService.farmGemOnce(userInfo);
        updateFarmResult("gem", gemFarmed);
        await delay(DELAY);
      } catch (error) {
        updateNotify(`Error ${error.status}! Please record screen and report in telegram group!`);
        await delay(ERROR_DELAY);
      }
    }
  };
  const xpFarmingLoop = async (value, amount, config = {}) => {
    while (isRunning) {
      try {
        let response;
        if (value === "session") {
          response = await apiService.farmSessionOnce(config);
        } else if (value === "story") {
          response = await apiService.farmStoryOnce(config);
        }
        if (response.status > 400) {
          updateNotify(`Something went wrong! Pls try other farming methods.
If you are using story method, make sure you are on English course (learning language == en)!`);
          await delay(ERROR_DELAY);
          continue;
        }
        const responseData = await response.json();
        const xpFarmed = (responseData == null ? void 0 : responseData.awardedXp) || (responseData == null ? void 0 : responseData.xpGain) || 0;
        updateFarmResult("xp", xpFarmed);
        await delay(DELAY);
      } catch (error) {
        updateNotify(`Error ${error.status}! Please record screen and report in telegram group!`);
        await delay(ERROR_DELAY);
      }
    }
  };
  const streakFarmingLoop = async () => {
    const hasStreak = !!userInfo.streakData.currentStreak;
    const startStreakDate = hasStreak ? userInfo.streakData.currentStreak.startDate : /* @__PURE__ */ new Date();
    const startFarmStreakTimestamp = toTimestamp(startStreakDate);
    let currentTimestamp = hasStreak ? startFarmStreakTimestamp - 86400 : startFarmStreakTimestamp;
    while (isRunning) {
      try {
        const sessionRes = await apiService.farmSessionOnce({ startTime: currentTimestamp, endTime: currentTimestamp + 60 });
        if (sessionRes) {
          currentTimestamp -= 86400;
          updateFarmResult("streak", 1);
          await delay(DELAY);
        } else {
          updateNotify("Failed to farm streak session, I'm trying again...");
          await delay(ERROR_DELAY);
          continue;
        }
      } catch (error) {
        updateNotify(`Error in farmStreak: ${(error == null ? void 0 : error.message) || error}`);
        await delay(ERROR_DELAY);
        continue;
      }
    }
  };
  const farmSelectedOption = async (option) => {
    const { type, value, amount, config } = option;
    switch (type) {
      case "gem":
        gemFarmingLoop();
        break;
      case "xp":
        xpFarmingLoop(value, amount, config);
        break;
      case "streak":
        streakFarmingLoop();
        break;
    }
  };
  const initVariables = async () => {
    jwt = getJwtToken();
    if (!jwt) {
      disableAllControls("Please login to Duolingo and reload!");
      return;
    }
    defaultHeaders = formatHeaders(jwt);
    const decodedJwt = decodeJwtToken(jwt);
    sub = decodedJwt.sub;
    userInfo = await ApiService.getUserInfo(sub, defaultHeaders);
    apiService = new ApiService(jwt, defaultHeaders, userInfo, sub);
    populateOptions();
  };
  (async () => {
    try {
      initInterface();
      setInterfaceVisible(false);
      addEventListeners();
      await initVariables();
      updateUserInfo();
    } catch (err) {
      logError(err, "init main.js");
    }
  })();

})();