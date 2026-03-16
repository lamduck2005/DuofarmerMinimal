export const log = (message) => {
  if (typeof GM_log !== 'undefined') {
    GM_log(message);
  } else {
    console.log('[DuoFarmer]', message);
  }
};

export const logError = (error, context = "") => {
  const message = error?.message || error?.toString() || "Unknown error";
  const fullMessage = context ? `[${context}] ${message}` : message;
  log(fullMessage);
};

export const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const toTimestamp = (dateStr) => {
  return Math.floor(new Date(dateStr).getTime() / 1000);
};

export const getCurrentUnixTimestamp = () => {
  return Math.floor(Date.now() / 1000);
};

export const daysBetween = (startTimestamp, endTimestamp) => {
  return Math.floor((endTimestamp - startTimestamp) / (60 * 60 * 24));
};

export const getJwtToken = () => {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith('jwt_token=')) {
      return cookie.substring('jwt_token='.length);
    }
  }
  return null;
};

export const decodeJwtToken = (token) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );
  return JSON.parse(jsonPayload);
};
