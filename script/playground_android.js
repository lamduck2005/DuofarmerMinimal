import {
  daysBetween,
  decodeJwtToken,
  getAllUserInfo,
  getHeadersAndroid,
  getUserInfo,
  JWT,
  saveToFile,
  sendRequest,
  sendRequestWithDefaultHeaders,
  toTimestamp,
} from "./utils.js";

const jwtToken = JWT;
const decodedJwt = decodeJwtToken(jwtToken);
const headers = getHeadersAndroid();

const createSession = async (fromLanguage, learningLanguage) => {
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
    fromLanguage: fromLanguage,
    isFinalLevel: false,
    isV2: true,
    juicy: true,
    learningLanguage: learningLanguage,
    smartTipsVersion: 2,
    type: "GLOBAL_PRACTICE",
  };
  const response = await sendRequestWithDefaultHeaders({
    url: "https://www.duolingo.com/2017-06-30/sessions",
    payload: sessionPayload,
    method: "POST",
  });
  return await response.json();
};

const updateSession = async (session, startTime, endTime) => {
  const updateSessionPayload = {
    ...session,
    heartsLeft: 0,
    startTime: startTime,
    enableBonusPoints: false,
    endTime: endTime,
    failed: false,
    maxInLessonStreak: 9,
    shouldLearnThings: true,
  };

  const response = await sendRequestWithDefaultHeaders({
    url: `https://www.duolingo.com/2017-06-30/sessions/${session.id}`,
    payload: updateSessionPayload,
    method: "PUT",
  });
  return await response.json();
};

const main = async () => {
  // await getUserInfo(decodedJwt.sub, headers);
  const user = await getUserInfo(decodedJwt.sub);

  const startStreakTimestamp = toTimestamp(
    user.streakData.currentStreak.startDate
  );
  const endStreakTimestamp = toTimestamp(user.streakData.currentStreak.endDate);
  const expectedStreak = daysBetween(startStreakTimestamp, endStreakTimestamp) + 1; //+1 vì nó bị lệch gì đó

  /////////////////////////////////////////////////////////////////////////////////
  let currentTime = Math.floor(Date.now() / 1000);

  for(let i = 0 ; i < expectedStreak; i++){
    const createdSession = await createSession(
      user.fromLanguage,
      user.learningLanguage
    );

    const response = await updateSession(
      createdSession,
      currentTime,
      currentTime + 60
    );
    currentTime -= 86400;
  }

  const userAfterRepair = await getUserInfo(decodedJwt.sub);
  if( userAfterRepair.streakData.currentStreak.length > expectedStreak){
    console.log("Streak repaired successfully!");
  } else {
    console.log("Streak repair failed or no frozen streak!");
  }
};

main();
