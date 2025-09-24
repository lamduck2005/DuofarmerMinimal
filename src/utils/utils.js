export const log = (message) => {
  // Fallback cho môi trường dev
  if (typeof GM_log !== 'undefined') {
    GM_log(message);
  } else {
    console.log('[DuoFarmer]', message);
  }
};

// Simple error logging
export const logError = (error, context = "") => {
  const message = error?.message || error?.toString() || "Unknown error";
  const fullMessage = context ? `[${context}] ${message}` : message;
  log(fullMessage);
};

// Delay function
export const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Convert date string to timestamp
export const toTimestamp = (dateStr) => {
  return Math.floor(new Date(dateStr).getTime() / 1000);
};

// Get current Unix timestamp (seconds)
export const getCurrentUnixTimestamp = () => {
  return Math.floor(Date.now() / 1000);
};

// Calculate days between two timestamps
export const daysBetween = (startTimestamp, endTimestamp) => {
  return Math.floor((endTimestamp - startTimestamp) / (60 * 60 * 24));
};

// Get JWT token from cookies
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

// Decode JWT token
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

// Format headers for API requests
export const formatHeaders = (jwtToken) => {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwtToken}`,
    'User-Agent': navigator.userAgent,
  };
};


export const extractSkillId = (currentCourse) => {
	const sections = currentCourse?.pathSectioned || [];
	for (const section of sections) {
		const units = section.units || [];
		for (const unit of units) {
			const levels = unit.levels || [];
			for (const level of levels) {
				const skillId = level.pathLevelMetadata?.skillId || level.pathLevelClientData?.skillId;
				if (skillId) return skillId;
			}
		}
	}
	return null;
};