import {
  daysBetween,
  decodeJwtToken,
  delay,
  getHeadersAndroid,
  getJwtFromAccount,
  getUserInfo,
  sendRequestWithDefaultHeaders,
  toTimestamp,
} from "./utils.js";

const JWT = getJwtFromAccount();
const DECODED_JWT = decodeJwtToken(JWT);
var userInfo = {};

const createSession = async () => {
  const idReward =
    "SKILL_COMPLETION_BALANCED-dd2495f4_d44e_3fc3_8ac8_94e2191506f0-2-GEMS";
  const patchUrl = `https://www.duolingo.com/2017-06-30/users/${DECODED_JWT.sub}/rewards/${idReward}`;
  const patchData = {
    consumed: true,
    fromLanguage: userInfo.fromLanguage,
    learningLanguage: userInfo.learningLanguage
  };
  const response = await sendRequestWithDefaultHeaders({
    url: patchUrl,
    payload: patchData,
    method: "PATCH",
  });
  return await response.json();
};

const main = async () => {
  userInfo = await getUserInfo(DECODED_JWT.sub);
  while(true){
    const response = await createSession();
    userInfo.gems += 30;

    console.clear();
    console.log(userInfo.gems);
    await delay(100);
  }
};

main();
