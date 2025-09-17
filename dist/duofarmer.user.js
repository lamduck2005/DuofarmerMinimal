// ==UserScript==
// @name         DuoFarmer
// @namespace    https://duo-farmer.vercel.app
// @version      1.3
// @author       Lamduck
// @description  [ MINIMAL UI ] DuoFarmer is a tool that helps you earn XP in Duolingo at blazing speed.
// @license      none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=duolingo.com
// @match        https://*.duolingo.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const templateRaw = '<div id="overlay"></div>\r\n<div id="container">\r\n  <div id="header">\r\n    <span class="label">Duofarmer minimal UI</span>\r\n  </div>\r\n  <div id="body">\r\n    <table id="table-main" class="table">\r\n      <thead>\r\n        <tr>\r\n          <th>Username</th>\r\n          <th>From</th>\r\n          <th>Learning</th>\r\n        </tr>\r\n      </thead>\r\n      <tbody>\r\n        <tr>\r\n          <td id="username">duofarmer</td>\r\n          <td id="from">any</td>\r\n          <td id="learn">any</td>\r\n        </tr>\r\n      </tbody>\r\n    </table>\r\n    <table id="table-progress" class="table">\r\n      <thead>\r\n        <tr>\r\n          <th>Streak</th>\r\n          <th>Gem</th>\r\n          <th>XP</th>\r\n        </tr>\r\n      </thead>\r\n      <tbody>\r\n        <tr>\r\n          <td id="streak">0</td>\r\n          <td id="gem">0</td>\r\n          <td id="xp">0</td>\r\n        </tr>\r\n      </tbody>\r\n    </table>\r\n    <div id="action-row">\r\n      <select id="select-option">\r\n        <!-- <option value="option1">Option 1</option> -->\r\n        <!-- <option value="option2">Option 2</option> -->\r\n      </select>\r\n      <button id="start-btn">Start</button>\r\n      <button id="stop-btn" hidden>Stop</button>\r\n    </div>\r\n    <div id="notify">High ban risk! Use with caution.<br /></div>\r\n    <a id="blank-page-link" href="https://www.duolingo.com/errors/404.html"\r\n      >Blank page (click here)</a\r\n    >\r\n  </div>\r\n  <div id="footer">\r\n    <a href="https://greasyfork.org/vi/scripts/528621-duofarmer" target="_blank"\r\n      >Greasyfork</a\r\n    >\r\n    <a href="https://t.me/duofarmer" target="_blank">Telegram</a>\r\n    <a href="https://duo-farmer.vercel.app" target="_blank">Homepage</a>\r\n  </div>\r\n</div>\r\n<div id="floating-btn">🐸</div>\r\n';
  const cssText = "#container{width:90vw;max-width:800px;min-height:40vh;max-height:90vh;background:#222;color:#fff;border-radius:10px;box-shadow:0 2px 12px #0008;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999}#header{height:60px;background:#333;display:flex;align-items:center;justify-content:center;border-top-left-radius:10px;border-top-right-radius:10px;width:100%}#body{min-height:40vh;max-height:100%;min-width:0;background:#282828;display:flex;align-items:center;justify-content:center;width:100%;overflow-y:auto;flex:1;flex-direction:column}#footer{height:50px;background:#222;display:flex;align-items:center;justify-content:space-evenly;border-bottom-left-radius:10px;border-bottom-right-radius:10px;width:100%}.label{font-size:1em}#header .label{font-size:1.5em;font-style:italic;font-weight:700;color:#fac8ff}#body .label{font-size:1.2em}.table{width:100%;background:#232323;color:#fff;border-radius:8px;padding:8px 12px;text-align:center;table-layout:fixed}.table th,.table td{padding:9px 12px;text-align:center;border-bottom:1px solid #444;width:1%}.table tbody tr:last-child td{border-bottom:none}#body h3{margin:0;color:#fff;font-size:1.1em;font-weight:700;letter-spacing:1px}#action-row{width:90%;display:flex;justify-content:space-between;align-items:center;margin:8px 0;gap:8px}#select-option{width:90%;max-width:90%;margin-right:8px;padding:8px 12px;border-radius:6px;border:1px solid #444;background:#232323;color:#fff;font-size:1em;outline:none}#start-btn,#stop-btn{width:auto;margin-left:0;padding:8px 18px;border-radius:6px;border:none;background:#229100;color:#fff;font-size:1em;font-weight:700;cursor:pointer;box-shadow:0 2px 8px #0003}#stop-btn{background:#af0303}.disable-btn{background:#52454560!important;cursor:not-allowed!important}#notify{width:90%;max-width:90%;min-height:10vh;margin:8px 0;padding:8px 12px;border-radius:6px;background:#333;color:#c8ff00;font-size:1em;word-wrap:break-word}#blank-page-link{margin-bottom:8px;color:#fce6ff;font-weight:700;font-style:italic}#footer a,#footer span{text-decoration:none;color:#00aeff;font-size:1em;font-weight:700;font-style:italic}#overlay{position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000c;z-index:9998;pointer-events:all}#floating-btn{position:fixed;bottom:10%;right:2%;width:40px;height:40px;background:#35bd00;border-radius:50%;box-shadow:0 2px 8px #0000004d;z-index:10000;cursor:pointer;display:flex;align-items:center;justify-content:center}.hidden{display:none}";
  const DELAY = 500;
  let jwt, defaultHeaders, userInfo, sub;
  let isRunning = false;
  let shadowRoot = null;
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
  };
  const setInterfaceVisible = (visible) => {
    const container = shadowRoot.getElementById("container");
    const overlay = shadowRoot.getElementById("overlay");
    if (!container || !overlay) return;
    container.style.display = visible ? "flex" : "none";
    overlay.style.display = visible ? "block" : "none";
  };
  const isInterfaceVisible = () => {
    const container = shadowRoot.getElementById("container");
    if (!container) return false;
    return container.style.display !== "none" && container.style.display !== "";
  };
  const addEventFloatingBtn = () => {
    const floatingBtn = shadowRoot.getElementById("floating-btn");
    const startBtn = shadowRoot.getElementById("start-btn");
    const stopBtn = shadowRoot.getElementById("stop-btn");
    const select = shadowRoot.getElementById("select-option");
    if (!floatingBtn || !startBtn || !stopBtn || !select) return;
    floatingBtn.addEventListener("click", () => {
      if (isRunning) {
        if (confirm("Duofarmer is farming. Do you want to stop and hide UI?")) {
          isRunning = false;
          stopBtn.hidden = true;
          startBtn.hidden = false;
          startBtn.disabled = true;
          startBtn.className = "disable-btn";
          select.disabled = false;
          setTimeout(() => {
            startBtn.className = "";
            startBtn.disabled = false;
          }, 2e3);
          setInterfaceVisible(false);
          return;
        } else {
          return;
        }
      }
      setInterfaceVisible(!isInterfaceVisible());
    });
  };
  const addEventStartBtn = () => {
    const startBtn = shadowRoot.getElementById("start-btn");
    const stopBtn = shadowRoot.getElementById("stop-btn");
    const select = shadowRoot.getElementById("select-option");
    if (!startBtn || !stopBtn || !select) return;
    startBtn.addEventListener("click", async () => {
      isRunning = true;
      startBtn.hidden = true;
      stopBtn.hidden = false;
      stopBtn.disabled = true;
      stopBtn.className = "disable-btn";
      select.disabled = true;
      const selected = select.options[select.selectedIndex];
      const optionData = {
        type: selected.getAttribute("data-type"),
        amount: Number(selected.getAttribute("data-amount")),
        from: selected.getAttribute("data-from"),
        learn: selected.getAttribute("data-learn"),
        value: selected.value,
        label: selected.textContent
      };
      await farmSelectedOption(optionData);
      setTimeout(() => {
        stopBtn.className = "";
        stopBtn.disabled = false;
      }, 2e3);
    });
  };
  const addEventStopBtn = () => {
    const startBtn = shadowRoot.getElementById("start-btn");
    const stopBtn = shadowRoot.getElementById("stop-btn");
    const select = shadowRoot.getElementById("select-option");
    if (!startBtn || !stopBtn || !select) return;
    stopBtn.addEventListener("click", () => {
      isRunning = false;
      stopBtn.hidden = true;
      startBtn.hidden = false;
      startBtn.disabled = true;
      startBtn.className = "disable-btn";
      select.disabled = false;
      setTimeout(() => {
        startBtn.className = "";
        startBtn.disabled = false;
      }, 2e3);
    });
  };
  const addEventListeners = () => {
    addEventFloatingBtn();
    addEventStartBtn();
    addEventStopBtn();
  };
  const populateOptions = () => {
    const select = shadowRoot.getElementById("select-option");
    if (!select) return;
    select.innerHTML = "";
    const fromLang = (userInfo == null ? void 0 : userInfo.fromLanguage) || "ru";
    (userInfo == null ? void 0 : userInfo.learningLanguage) || "en";
    const options = [
      { type: "gem", label: `Gem 30`, value: `gem-30`, amount: 30 },
      { type: "xp", label: `XP 499 (any -> en)`, value: `xp-499`, amount: 499, from: fromLang, learn: "en" },
      { type: "streak", label: `Streak repair (restore frozen streak)`, value: `repair` },
      { type: "streak", label: `Streak farm (beta test)`, value: `farm` }
    ];
    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      option.setAttribute("data-type", opt.type);
      if (opt.amount != null) option.setAttribute("data-amount", String(opt.amount));
      if (opt.from) option.setAttribute("data-from", opt.from);
      if (opt.learn) option.setAttribute("data-learn", opt.learn);
      select.appendChild(option);
    });
  };
  const updateNotify = (message) => {
    const notify = shadowRoot.getElementById("notify");
    if (!notify) return;
    const now = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    notify.innerText = `[${now}] ` + message;
  };
  const disableInterface = (notify = {}) => {
    const startBtn = shadowRoot.getElementById("start-btn");
    const stopBtn = shadowRoot.getElementById("stop-btn");
    const select = shadowRoot.getElementById("select-option");
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.className = "disable-btn";
    }
    if (stopBtn) stopBtn.disabled = true;
    if (select) select.disabled = true;
    if (notify) {
      const notifyElement = shadowRoot.getElementById("notify");
      if (notifyElement) notifyElement.innerText = notify;
    }
  };
  const resetStartStopBtn = () => {
    isRunning = false;
    const startBtn = shadowRoot.getElementById("start-btn");
    const stopBtn = shadowRoot.getElementById("stop-btn");
    const select = shadowRoot.getElementById("select-option");
    if (stopBtn) stopBtn.hidden = true;
    if (startBtn) {
      startBtn.hidden = false;
      startBtn.disabled = true;
      startBtn.className = "disable-btn";
    }
    if (select) select.disabled = false;
    setTimeout(() => {
      if (startBtn) {
        startBtn.className = "";
        startBtn.disabled = false;
      }
    }, 2e3);
  };
  const blockStopBtn = () => {
    const stopBtn = shadowRoot.getElementById("stop-btn");
    if (!stopBtn) return;
    stopBtn.disabled = true;
    stopBtn.classList.add("disable-btn");
  };
  const unblockStopBtn = () => {
    const stopBtn = shadowRoot.getElementById("stop-btn");
    if (!stopBtn) return;
    stopBtn.disabled = false;
    stopBtn.classList.remove("disable-btn");
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
  const formatHeaders = (jwtToken) => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + jwtToken,
    "User-Agent": navigator.userAgent
  });
  const getUserInfo = async (userSub) => {
    const userInfoUrl = `https://www.duolingo.com/2017-06-30/users/${userSub}?fields=id,username,fromLanguage,learningLanguage,streak,totalXp,level,numFollowers,numFollowing,gems,creationDate,streakData`;
    const response = await fetch(userInfoUrl, { method: "GET", headers: defaultHeaders });
    return await response.json();
  };
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const updateUserInfo = () => {
    const username = shadowRoot.getElementById("username");
    const from = shadowRoot.getElementById("from");
    const learn = shadowRoot.getElementById("learn");
    const streak = shadowRoot.getElementById("streak");
    const gem = shadowRoot.getElementById("gem");
    const xp = shadowRoot.getElementById("xp");
    if (username) username.innerText = userInfo.username;
    if (from) from.innerText = userInfo.fromLanguage;
    if (learn) learn.innerText = userInfo.learningLanguage;
    if (streak) streak.innerText = userInfo.streak;
    if (gem) gem.innerText = userInfo.gems;
    if (xp) xp.innerText = userInfo.totalXp;
  };
  const toTimestamp = (dateStr) => Math.floor(new Date(dateStr).getTime() / 1e3);
  const daysBetween = (startTimestamp, endTimestamp) => Math.floor((endTimestamp - startTimestamp) / (60 * 60 * 24));
  const sendRequest = async ({ url, payload, headers, method = "PUT" }) => {
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
  };
  const sendRequestWithDefaultHeaders = async ({ url, payload, headers = {}, method = "GET" }) => {
    const mergedHeaders = { ...defaultHeaders, ...headers };
    return sendRequest({ url, payload, headers: mergedHeaders, method });
  };
  const farmGemOnce = async () => {
    const idReward = "SKILL_COMPLETION_BALANCED-dd2495f4_d44e_3fc3_8ac8_94e2191506f0-2-GEMS";
    const patchUrl = `https://www.duolingo.com/2017-06-30/users/${sub}/rewards/${idReward}`;
    const patchData = {
      consumed: true,
      learningLanguage: userInfo.learningLanguage,
      fromLanguage: userInfo.fromLanguage
    };
    return await sendRequestWithDefaultHeaders({ url: patchUrl, payload: patchData, method: "PATCH" });
  };
  const farmGemLoop = async () => {
    const gemFarmed = 30;
    while (isRunning) {
      try {
        await farmGemOnce();
        userInfo = { ...userInfo, gems: userInfo.gems + gemFarmed };
        updateNotify(`You got ${gemFarmed} gem!!!`);
        updateUserInfo();
        await delay(DELAY);
      } catch (error) {
        updateNotify(`Error ${error.status}! Please record screen and report in telegram group!`);
        await delay(DELAY + 1e3);
      }
    }
  };
  const farmXpOnce = async (amount) => {
    const startTime = Math.floor(Date.now() / 1e3);
    const fromLanguage = userInfo.fromLanguage;
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
      happyHourBonusXp: 449
    };
    return await sendRequestWithDefaultHeaders({ url: completeUrl, payload, headers: defaultHeaders, method: "POST" });
  };
  const farmXpLoop = async (amount) => {
    while (isRunning) {
      try {
        const response = await farmXpOnce(amount);
        if (response.status == 500) {
          updateNotify("Make sure you are on English course (learning lang must be EN)!");
          await delay(DELAY + 1e3);
          continue;
        }
        const responseData = await response.json();
        const xpFarmed = (responseData == null ? void 0 : responseData.awardedXp) || 0;
        userInfo = { ...userInfo, totalXp: userInfo.totalXp + xpFarmed };
        updateNotify(`You got ${xpFarmed} XP!!!`);
        updateUserInfo();
        await delay(DELAY);
      } catch (error) {
        updateNotify(`Error ${error.status}! Please record screen and report in telegram group!`);
        await delay(DELAY + 1e3);
      }
    }
  };
  const farmSessionOnce = async (startTime, endTime) => {
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
      fromLanguage: userInfo.fromLanguage,
      isFinalLevel: false,
      isV2: true,
      juicy: true,
      learningLanguage: userInfo.learningLanguage,
      smartTipsVersion: 2,
      type: "GLOBAL_PRACTICE"
    };
    const sessionRes = await sendRequestWithDefaultHeaders({ url: "https://www.duolingo.com/2017-06-30/sessions", payload: sessionPayload, method: "POST" });
    const sessionData = await sessionRes.json();
    const updateSessionPayload = {
      ...sessionData,
      heartsLeft: 0,
      startTime,
      enableBonusPoints: false,
      endTime,
      failed: false,
      maxInLessonStreak: 9,
      shouldLearnThings: true
    };
    const updateRes = await sendRequestWithDefaultHeaders({ url: `https://www.duolingo.com/2017-06-30/sessions/${sessionData.id}`, payload: updateSessionPayload, method: "PUT" });
    return await updateRes.json();
  };
  const repairStreak = async () => {
    blockStopBtn();
    try {
      if (!userInfo.streakData.currentStreak) {
        updateNotify("You have no streak! Abort!");
        resetStartStopBtn();
      }
      const startStreakDate = userInfo.streakData.currentStreak.startDate;
      const endStreakDate = userInfo.streakData.currentStreak.endDate;
      const startStreakTimestamp = toTimestamp(startStreakDate);
      const endStreakTimestamp = toTimestamp(endStreakDate);
      const expectedStreak = daysBetween(startStreakTimestamp, endStreakTimestamp) + 1;
      if (expectedStreak > userInfo.streak) {
        updateNotify("Your streak is frozen somewhere! Repairing...");
        await delay(2e3);
        let currentTimestamp = Math.floor(Date.now() / 1e3);
        for (let i = 0; i < expectedStreak; i++) {
          await farmSessionOnce(currentTimestamp, currentTimestamp + 60);
          currentTimestamp -= 86400;
          updateNotify(`Trying to repair streak ( ${i + 1}/${expectedStreak})...`);
          await delay(DELAY);
        }
        const userAfterRepair = await getUserInfo(sub);
        if (userAfterRepair.streakData.currentStreak.length > expectedStreak) {
          updateNotify("Your streak has been repaired! No more frozen streak!");
          userInfo = userAfterRepair;
          updateUserInfo();
        } else {
          updateNotify("Streak repair failed or no frozen streak! Please check your account!");
        }
      } else {
        updateNotify("You have no frozen streak! No need to repair!");
        resetStartStopBtn();
        return;
      }
    } finally {
      unblockStopBtn();
    }
  };
  const farmStreakLoop = async () => {
    const hasStreak = !!userInfo.streakData.currentStreak;
    const startStreakDate = hasStreak ? userInfo.streakData.currentStreak.startDate : /* @__PURE__ */ new Date();
    const startFarmStreakTimestamp = toTimestamp(startStreakDate);
    let currentTimestamp = hasStreak ? startFarmStreakTimestamp - 86400 : startFarmStreakTimestamp;
    while (isRunning) {
      try {
        const sessionRes = await farmSessionOnce(currentTimestamp, currentTimestamp + 60);
        if (sessionRes) {
          currentTimestamp -= 86400;
          userInfo = { ...userInfo, streak: userInfo.streak + 1 };
          updateNotify("You got +1 streak!");
          updateUserInfo();
          await delay(DELAY);
        } else {
          updateNotify("Failed to farm streak session, I'm trying again...");
          await delay(2e3);
          continue;
        }
      } catch (error) {
        updateNotify(`Error in farmStreak: ${(error == null ? void 0 : error.message) || error}`);
        await delay(2e3);
        continue;
      }
    }
  };
  const farmSelectedOption = async (option) => {
    const { type, value, amount } = option;
    switch (type) {
      case "gem":
        farmGemLoop();
        break;
      case "xp":
        farmXpLoop(amount);
        break;
      case "streak":
        if (value === "repair") {
          repairStreak();
        } else if (value === "farm") {
          farmStreakLoop();
        }
        break;
    }
  };
  const initVariables = async () => {
    jwt = getJwtToken();
    if (!jwt) {
      disableInterface("Please login to Duolingo and reload!");
      return;
    }
    defaultHeaders = formatHeaders(jwt);
    const decodedJwt = decodeJwtToken(jwt);
    sub = decodedJwt.sub;
    userInfo = await getUserInfo(sub);
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
      console.error("[DuoFarmer] init failed:", err);
    }
  })();

})();