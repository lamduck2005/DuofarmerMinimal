import fs from "fs";

export const getJwtFromAccount = () => {
  const accountPath = "./account.json";
  const raw = fs.readFileSync(accountPath, "utf8");
  const data = JSON.parse(raw);
  return data.jwt;
};

export const JWT = getJwtFromAccount();

export const saveToFile = (filename, data) => {
  const content =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, content, "utf8");
};

export const getHeadersAndroid = () => {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + JWT,
    "User-Agent":
      "Duodroid/6.28.5 Dalvik/2.1.0 (Linux; U; Android 12; SM-G980 Build/V417IR)",
    accept: "application/json",
  };
};

export const decodeJwtToken = (token) => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
  return JSON.parse(jsonPayload);
};

export const sendRequest = async ({
  url,
  payload,
  headers,
  method = "PUT",
}) => {
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    // console.log({
    //   status: res.status,
    //   statusText: res.statusText,
    //   headers: Object.fromEntries(res.headers.entries()),
    //   url: res.url,
    //   ok: res.ok,
    //   redirected: res.redirected,
    //   type: res.type,
    //   bodyUsed: res.bodyUsed,
    // });
    return res;
  } catch (error) {
    console.log(`Lỗi ${error.message} khi ${method}!`);
    console.log("Url:", url);
    return error;
  }
};

export const sendRequestWithDefaultHeaders = async ({
  url,
  payload,
  headers = {},
  method = "GET",
}) => {
  const mergedHeaders = { ...getHeadersAndroid(), ...headers };
  return sendRequest({ url, payload, headers: mergedHeaders, method });
};

export const getUserInfo = async (sub) => {
  const userInfoUrl = `https://www.duolingo.com/2017-06-30/users/${sub}?fields=id,username,fromLanguage,learningLanguage,streak,totalXp,gems,creationDate,streakData`;
  const response = await sendRequestWithDefaultHeaders({
    url: userInfoUrl,
  });
  const data = await response.json();
  const {
    id: userId,
    username,
    streak,
    gems,
    totalXp,
    fromLanguage,
    learningLanguage,
    creationDate,
  } = data;
  console.log(
    `${userId} - ${username} - ${streak} streak - ${gems} gems - ${totalXp} xp - ${fromLanguage} - ${learningLanguage} - ${creationDate}`
  );
  return data;
};

export const getAllUserInfo = async (sub) => {
  const userInfoUrl = `https://www.duolingo.com/2017-06-30/users/${sub}`;
  const response = await sendRequestWithDefaultHeaders({
    url: userInfoUrl,
  });
  const data = await response.json();
  return data;
};


export const toTimestamp = (dateStr) => {
  return Math.floor(new Date(dateStr).getTime() / 1000);
};

export const daysBetween = (startTimestamp, endTimestamp) => {
  return Math.floor((endTimestamp - startTimestamp) / (60 * 60 * 24));
};

export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

