// ==UserScript==
// @name         DuoFarmer
// @namespace    https://duo-farmer.vercel.app
// @version      1.2
// @description  [ LITE ] DuoFarmer is a tool that helps you earn XP in Duolingo at blazing speed.
// @description:vi [ LITE ] DuoFarmer là một công cụ giúp bạn hack XP trong Duolingo với tốc độ cực nhanh.
// @description:fr [ LITE ] DuoFarmer est un outil qui vous aide à gagner de l'XP sur Duolingo à une vitesse fulgurante.
// @description:es [ LITE ] DuoFarmer es una herramienta que te ayuda a ganar XP en Duolingo a una velocidad asombrosa.
// @description:de [ LITE ] DuoFarmer ist ein Tool, das Ihnen hilft, in Duolingo blitzschnell XP zu verdienen.
// @description:it [ LITE ] DuoFarmer è uno strumento che ti aiuta a guadagnare XP su Duolingo a una velocità incredibile.
// @description:ja [ LITE ] DuoFarmer は、Duolingo で驚異的なスピードで XP を獲得するのに役立つツールです。
// @description:ko [ LITE ] DuoFarmer는 Duolingo에서 엄청난 속도로 XP를 얻을 수 있도록 도와주는 도구입니다.
// @description:ru [ LITE ] DuoFarmer - это инструмент, который помогает вам зарабатывать XP в Duolingo с невероятной скоростью.
// @description:zh-CN [ LITE ] DuoFarmer 是一款可帮助您以惊人的速度在 Duolingo 中赚取 XP 的工具。
// @author       Lamduck
// @match        https://*.duolingo.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=duolingo.com
// @grant        none
// @license      none
// ==/UserScript==

const VERSION = "1.2";
const DELAY = 500;
var jwt, defaultHeaders, userInfo, sub;
let isRunning = false;

const initInterface = () => {
  const containerHTML = `
  <link rel="stylesheet" href="xp.css" />
<div id="_overlay"></div>
<div id="_container">
  <div id="_header">
    <span class="_label">Duofarmer minimal UI</span>
  </div>
  <div id="_body">
    <table id="_table_main" class="_table">
      <thead>
        <tr>
          <th>Username</th>
          <th>From</th>
          <th>Learning</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td id="_username">duofarmer</td>
          <td id="_from">any</td>
          <td id="_learn">any</td>
        </tr>
      </tbody>
    </table>
    <table id="_table_progress" class="_table">
      <thead>
        <tr>
          <th>Streak</th>
          <th>Gem</th>
          <th>XP</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td id="_streak">0</td>
          <td id="_gem">0</td>
          <td id="_xp">0</td>
        </tr>
      </tbody>
    </table>
    <div id="_action_row">
      <select id="_select_option">
        <!-- <option value="option1">Option 1</option> -->
        <!-- <option value="option2">Option 2</option> -->
      </select>
      <button id="_start_btn">Start</button>
      <button id="_stop_btn" hidden>Stop</button>
    </div>
    <div id="_notify">
      This is a minimal version that reduces device resources. <br />
      Only support learning language is English. <br />
      (will not work if from language is also English) <br>
      <br>
      Recommended to go to blank page for max performance + reduce resource usage.
    </div>
    <a id="_blank_page_link" href="https://www.duolingo.com/errors/404.html">Blank page (click here)</a>
  </div>
  <div id="_footer">
    <a href="https://greasyfork.org/vi/scripts/528621-duofarmer" target="_blank"
      >Greasyfork</a
    >
    <a href="https://t.me/duofarmer" target="_blank">Telegram</a>
    <a>Version <span id="_version">1.0</span></a>
  </div>
</div>
<div id="_floating_btn">😼</div>
`;

  const style = document.createElement("style");
  style.innerHTML = `#_container {
  width: 90vw;
  max-width: 800px;
  min-height: 40vh;
  max-height: 90vh;
  background: #222;
  color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px #0008;
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
}

#_header {
  height: 60px;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  width: 100%;
}

#_body {
  min-height: 40vh;
  max-height: 100%;
  min-width: 0;
  background: #282828;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow-y: auto;
  flex: 1;
  flex-direction: column;
}

#_footer {
  height: 50px;
  background: #222;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  width: 100%;
}

._label {
  font-size: 1em;
}

#_header ._label {
  font-size: 1.5em;
  font-style: italic;
  font-weight: bold;
  color: #fac8ff;
}

#_body ._label {
  font-size: 1.2em;
}

._table {
  width: 100%;
  background: #232323;
  color: #fff;
  border-radius: 8px;
  padding: 8px 12px;
  text-align: center;
  table-layout: fixed;
}

._table th,
._table td {
  padding: 9px 12px;
  text-align: center;
  border-bottom: 1px solid #444;
  width: 1%;
}

._table tbody tr:last-child td {
  border-bottom: none;
}

#_body h3 {
  margin: 0;
  color: #fff;
  font-size: 1.1em;
  font-weight: bold;
  letter-spacing: 1px;
}

#_action_row {
  width: 90%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0;
  gap: 8px;
}
#_select_option {
  width: 90%;
  max-width: 90%;
  margin-right: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #232323;
  color: #fff;
  font-size: 1em;
  outline: none;
}

#_start_btn, #_stop_btn {
  width: auto;
  margin-left: 0;
  padding: 8px 18px;
  border-radius: 6px;
  border: none;
  background: #229100;
  color: #fff;
  font-size: 1em;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 8px #0003;
}
#_stop_btn {
  background: #af0303;
}
._disable_btn {
  background: #52454560 !important;
  cursor: not-allowed !important;
}

#_notify {
  width: 90%;
  max-width: 90%;
  min-height: 10vh;
  margin: 8px 0;
  padding: 8px 12px;
  border-radius: 6px;
  background: #333;
  color: #c8ff00;
  font-size: 1em;
  word-wrap: break-word;
  /* text-align: center; */
}

#_blank_page_link {
  margin-bottom: 8px;
  color: #fce6ff;
  font-weight: bold;
  font-style: italic;
}

#_footer a,
#_footer span {
  text-decoration: none;
  color: #00aeff;
  font-size: 1em;
  font-weight: bold;
  font-style: italic;
}

#_overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.8);
  z-index: 9998;
  pointer-events: all;
}

#_floating_btn {
  position: fixed;
  bottom: 10%;
  right: 2%;
  width: 40px;
  height: 40px;
  background: #35bd00;
  border-radius: 50%;
  box-shadow: 0 2px 8px #0005;
  z-index: 10000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hidden{
  display: none;
}`;
  document.head.appendChild(style);

  const container = document.createElement("div");
  container.innerHTML = containerHTML;
  document.body.appendChild(container);

  // doi phien ban
  const version = document.getElementById("_version");
  version.innerText = VERSION;
};

const setInterfaceVisible = (visible) => {
  const container = document.getElementById("_container");
  const overlay = document.getElementById("_overlay");
  container.style.display = visible ? "flex" : "none";
  overlay.style.display = visible ? "block" : "none";
};

const isInterfaceVisible = () => {
  const container = document.getElementById("_container");
  return container.style.display !== "none" && container.style.display !== "";
};

const toggleInterface = () => {
  setInterfaceVisible(!isInterfaceVisible());
};

const addEventFloatingBtn = () => {
  const floatingBtn = document.getElementById("_floating_btn");
  const startBtn = document.getElementById("_start_btn");
  const stopBtn = document.getElementById("_stop_btn");
  const select = document.getElementById("_select_option");
  floatingBtn.addEventListener("click", () => {
    if (isRunning) {
      if (confirm("Duofarmer is farming. Do you want to stop and hide UI?")) {
        isRunning = false;
        stopBtn.hidden = true;
        startBtn.hidden = false;
        startBtn.disabled = true;
        startBtn.className = "_disable_btn";
        select.disabled = false;
        setTimeout(() => {
          startBtn.className = "";
          startBtn.disabled = false;
        }, 2000);
        setInterfaceVisible(false);
        return;
      } else {
        // Không làm gì nếu không muốn dừng
        return;
      }
    }
    setInterfaceVisible(!isInterfaceVisible());
  });
};

const addEventStartBtn = () => {
  const startBtn = document.getElementById("_start_btn");
  const stopBtn = document.getElementById("_stop_btn");
  const select = document.getElementById("_select_option");
  startBtn.addEventListener("click", async () => {
    isRunning = true;
    startBtn.hidden = true;
    stopBtn.hidden = false;
    stopBtn.disabled = true;
    stopBtn.className = "_disable_btn";
    select.disabled = true;

    // Lấy option đang chọn
    const selected = select.options[select.selectedIndex];
    const optionData = {
      type: selected.getAttribute("data-type"),
      amount: Number(selected.getAttribute("data-amount")),
      from: selected.getAttribute("data-from"),
      learn: selected.getAttribute("data-learn"),
      value: selected.value,
      label: selected.textContent,
    };
    await farmSelectedOption(optionData);

    setTimeout(() => {
      stopBtn.className = "";
      stopBtn.disabled = false;
    }, 2000);
  });
};

const addEventStopBtn = () => {
  const startBtn = document.getElementById("_start_btn");
  const stopBtn = document.getElementById("_stop_btn");
  const select = document.getElementById("_select_option");
  stopBtn.addEventListener("click", () => {
    isRunning = false;
    stopBtn.hidden = true;
    startBtn.hidden = false;
    startBtn.disabled = true;
    startBtn.className = "_disable_btn";
    select.disabled = false;
    setTimeout(() => {
      startBtn.className = "";
      startBtn.disabled = false;
    }, 2000);
  });
};

const addEventVersionLink = () => {
  const versionLink = document.getElementById("_version");
  versionLink.addEventListener("click", () => {
    prompt("Your JWT token: ", jwt);
  });
};

const addEventListeners = () => {
  addEventFloatingBtn();
  addEventStartBtn();
  addEventStopBtn();
  addEventVersionLink();
};

// Thêm hàm tạo option cho select
const populateOptions = () => {
  const select = document.getElementById("_select_option");
  select.innerHTML = "";
  // Lấy fromLanguage và learningLanguage từ userInfo nếu có
  const fromLang = userInfo?.fromLanguage || "ru";
  const learnLang = userInfo?.learningLanguage || "en";
  // Danh sách option mẫu
  const options = [
    { type: "gem", label: `Gem 30`, value: `gem-30`, amount: 30 },
    {
      type: "xp",
      label: `XP 499 (any -> en)`,
      value: `xp-499`,
      amount: 499,
      from: fromLang,
      learn: "en",
    },
    {
      type: "streak",
      label: `Streak repair (restore frozen streak)`,
      value: `repair`,
    },
    {
      type: "streak",
      label: `Streak farm (beta test)`,
      value: `farm`,
    },
  ];
  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    option.setAttribute("data-type", opt.type);
    option.setAttribute("data-amount", opt.amount);
    option.setAttribute("data-from", opt.from);
    option.setAttribute("data-learn", opt.learn);
    select.appendChild(option);
  });
};

const updateNotify = (message) => {
  const notify = document.getElementById("_notify");
  const now = new Date().toLocaleTimeString();
  notify.innerText = `[${now}] ` + message;
};

const disableInterface = (notify = {}) => {
  const startBtn = document.getElementById("_start_btn");
  const stopBtn = document.getElementById("_stop_btn");
  const select = document.getElementById("_select_option");
  startBtn.disabled = true;
  startBtn.className = "_disable_btn";
  stopBtn.disabled = true;
  select.disabled = true;

  if (notify) {
    const notifyElement = document.getElementById("_notify");
    notifyElement.innerText = notify;
  }
};

const resetStartStopBtn = () => {
  isRunning = false;
  const startBtn = document.getElementById("_start_btn");
  const stopBtn = document.getElementById("_stop_btn");
  const select = document.getElementById("_select_option");
  stopBtn.hidden = true;
  startBtn.hidden = false;
  startBtn.disabled = true;
  startBtn.className = "_disable_btn";
  select.disabled = false;
  setTimeout(() => {
    startBtn.className = "";
    startBtn.disabled = false;
  }, 2000);
};

const blockStopBtn = () => {
  const stopBtn = document.getElementById("_stop_btn");
  stopBtn.disabled = true;
  stopBtn.classList.add("_disable_btn");
};

const unblockStopBtn = () => {
  const stopBtn = document.getElementById("_stop_btn");
  stopBtn.disabled = false;
  stopBtn.classList.remove("_disable_btn");
};

//--------------------Logic--------------------//

const getJwtToken = () => {
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim();
    if (cookie.startsWith("jwt_token=")) {
      return cookie.substring("jwt_token=".length);
    }
  }
  return null;
};

const decodeJwtToken = (token) => {
  var base64Url = token.split(".")[1];
  var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  var jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
};

const formatHeaders = (jwt) => ({
  "Content-Type": "application/json",
  Authorization: "Bearer " + jwt,
  "User-Agent": navigator.userAgent,
});

const getUserInfo = async (sub) => {
  const userInfoUrl = `https://www.duolingo.com/2017-06-30/users/${sub}?fields=id,username,fromLanguage,learningLanguage,streak,totalXp,level,numFollowers,numFollowing,gems,creationDate,streakData`;
  let response = await fetch(userInfoUrl, {
    method: "GET",
    headers: defaultHeaders,
  });
  return await response.json();
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const updateUserInfo = () => {
  const username = document.getElementById("_username");
  const from = document.getElementById("_from");
  const learn = document.getElementById("_learn");
  const streak = document.getElementById("_streak");
  const gem = document.getElementById("_gem");
  const xp = document.getElementById("_xp");
  username.innerText = userInfo.username;
  from.innerText = userInfo.fromLanguage;
  learn.innerText = userInfo.learningLanguage;
  streak.innerText = userInfo.streak;
  gem.innerText = userInfo.gems;
  xp.innerText = userInfo.totalXp;
};

const toTimestamp = (dateStr) => {
  return Math.floor(new Date(dateStr).getTime() / 1000);
};

const daysBetween = (startTimestamp, endTimestamp) => {
  return Math.floor((endTimestamp - startTimestamp) / (60 * 60 * 24));
};

const sendRequest = async ({ url, payload, headers, method = "PUT" }) => {
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    return res;
  } catch (error) {
    return error;
  }
};

const sendRequestWithDefaultHeaders = async ({
  url,
  payload,
  headers = {},
  method = "GET",
}) => {
  const mergedHeaders = { ...defaultHeaders, ...headers };
  return sendRequest({ url, payload, headers: mergedHeaders, method });
};

const farmGemOnce = async () => {
  const idReward =
    "SKILL_COMPLETION_BALANCED-dd2495f4_d44e_3fc3_8ac8_94e2191506f0-2-GEMS";
  const patchUrl = `https://www.duolingo.com/2017-06-30/users/${sub}/rewards/${idReward}`;
  const patchData = {
    consumed: true,
    learningLanguage: userInfo.learningLanguage,
    fromLanguage: userInfo.fromLanguage,
  };
  return await sendRequestWithDefaultHeaders({
    url: patchUrl,
    payload: patchData,
    method: "PATCH",
  });
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
      updateNotify(
        `Error ${error.status}! Please record screen and report in telegram group!`
      );
      await delay(DELAY + 1000);
    }
  }
};

const farmXpOnce = async (amount) => {
  const startTime = Math.floor(Date.now() / 1000);
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
    startTime: startTime,
    fromLanguage: fromLanguage,
    learningLanguage: "en",
    hasXpBoost: false,
    happyHourBonusXp: 449,
  };
  return await sendRequestWithDefaultHeaders({
    url: completeUrl,
    payload: payload,
    headers: defaultHeaders,
    method: "POST",
  });
};

const farmXpLoop = async (amount) => {
  while (isRunning) {
    try {
      const response = await farmXpOnce(amount);
      if (response.status == 500) {
        updateNotify(
          "Make sure you are on English course (learning lang must be EN)!"
        );
        await delay(DELAY + 1000);
        continue;
      }
      const responseData = await response.json();
      const xpFarmed = responseData?.awardedXp || 0;
      userInfo = { ...userInfo, totalXp: userInfo.totalXp + xpFarmed };
      updateNotify(`You got ${xpFarmed} XP!!!`);
      updateUserInfo();
      await delay(DELAY);
    } catch (error) {
      updateNotify(
        `Error ${error.status}! Please record screen and report in telegram group!`
      );
      await delay(DELAY + 1000);
    }
  }
};

const farmSessionOnce = async (startTime, endTime) => {
  //tạo và lấy session
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
      "writeComprehension",
    ],
    fromLanguage: userInfo.fromLanguage,
    isFinalLevel: false,
    isV2: true,
    juicy: true,
    learningLanguage: userInfo.learningLanguage,
    smartTipsVersion: 2,
    type: "GLOBAL_PRACTICE",
  };
  const sessionRes = await sendRequestWithDefaultHeaders({
    url: "https://www.duolingo.com/2017-06-30/sessions",
    payload: sessionPayload,
    method: "POST",
  });
  const sessionData = await sessionRes.json();

  // lấy session và gán vào update
  const updateSessionPayload = {
    ...sessionData,
    heartsLeft: 0,
    startTime: startTime,
    enableBonusPoints: false,
    endTime: endTime,
    failed: false,
    maxInLessonStreak: 9,
    shouldLearnThings: true,
  };
  const updateRes = await sendRequestWithDefaultHeaders({
    url: `https://www.duolingo.com/2017-06-30/sessions/${sessionData.id}`,
    payload: updateSessionPayload,
    method: "PUT",
  });
  return await updateRes.json();
};

const repairStreak = async () => {
  blockStopBtn();
  try {
    if(!userInfo.streakData.currentStreak) {
      updateNotify("You have no streak! Abort!");
      resetStartStopBtn();
    }

    const startStreakDate = userInfo.streakData.currentStreak.startDate;
    const endStreakDate = userInfo.streakData.currentStreak.endDate;

    const startStreakTimestamp = toTimestamp(startStreakDate);
    const endStreakTimestamp = toTimestamp(endStreakDate);
    const expectedStreak =
      daysBetween(startStreakTimestamp, endStreakTimestamp) + 1; //+1 vì nó bị lệch gì đó

    //check xem có streak freeze không
    if (expectedStreak > userInfo.streak) {
      updateNotify("Your streak is frozen somewhere! Repairing...");
      await delay(2000);

      let currentTimestamp = Math.floor(Date.now() / 1000);
      for (let i = 0; i < expectedStreak; i++) {
        const createdSession = await farmSessionOnce(
          currentTimestamp,
          currentTimestamp + 60
        );
        currentTimestamp -= 86400;
        updateNotify(
          `Trying to repair streak ( ${i + 1}/${expectedStreak})...`
        );
        await delay(DELAY);
      }

      const userAfterRepair = await getUserInfo(sub);
      if (userAfterRepair.streakData.currentStreak.length > expectedStreak) {
        updateNotify(`Your streak has been repaired! No more frozen streak!`);
        userInfo = userAfterRepair;
        updateUserInfo();
      } else {
        updateNotify(
          `Streak repair failed or no frozen streak! Please check your account!`
        );
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
  const startStreakDate = hasStreak
    ? userInfo.streakData.currentStreak.startDate
    : new Date();

  const startFarmStreakTimestamp = toTimestamp(startStreakDate);
  let currentTimestamp = hasStreak
    ? startFarmStreakTimestamp - 86400 // Nếu đã có streak, farm từ ngày trước đó
    : startFarmStreakTimestamp;        // Nếu chưa có streak, farm luôn ngày hôm nay

  while (isRunning) {
    try {
      const sessionRes = await farmSessionOnce(currentTimestamp, currentTimestamp + 60);
      if (sessionRes) {
        currentTimestamp -= 86400;
        userInfo = { ...userInfo, streak: userInfo.streak + 1 };
        updateNotify(`You got +1 streak!`);
        updateUserInfo();
        await delay(DELAY);
      } else {
        updateNotify("Failed to farm streak session, I'm trying again...");
        await delay(2000);
        continue;
      }
    } catch (error) {
      updateNotify(`Error in farmStreak: ${error?.message || error}`);
      await delay(2000);
      continue;
    }
  }
}

const farmSelectedOption = async (option) => {
  const { type, value, amount, from, learn } = option;

  switch (type) {
    case "gem":
      farmGemLoop();
      break;
    case "xp":
      farmXpLoop(amount);
      break;
    case "streak":
      if (value == "repair") {
        repairStreak();
      } else if (value == "farm") {
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
  populateOptions(); // cập nhật lại option khi đã có userInfo
};

//--------------------Main--------------------//

(async () => {
  initInterface();
  setInterfaceVisible(false);
  addEventListeners();
  await initVariables();
  updateUserInfo();
})();
