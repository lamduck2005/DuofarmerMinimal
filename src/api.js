import { getCurrentUnixTimestamp } from './utils.js';

export async function getUserInfo(sub, headers) {
    const url = `https://www.duolingo.com/2017-06-30/users/${sub}?fields=id,username,fromLanguage,learningLanguage,streak,totalXp,level,numFollowers,numFollowing,gems,creationDate,streakData,privacySettings,currentCourse{pathSectioned{units{levels{pathLevelMetadata{skillId}}}}}`;
    const response = await fetch(url, { method: 'GET', headers });
    return await response.json();
}

export function createApi(jwt, userInfo, getSignal) {
    const sub = userInfo.id;
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
        'User-Agent': navigator.userAgent,
    };

    async function sendRequest({ url, payload, method = 'PUT' }) {
        const res = await fetch(url, {
            method,
            headers,
            body: payload ? JSON.stringify(payload) : undefined,
            signal: getSignal?.(),
        });
        return res;
    }

    async function farmGemOnce() {
        const idReward = 'SKILL_COMPLETION_BALANCED-dd2495f4_d44e_3fc3_8ac8_94e2191506f0-2-GEMS';
        const patchUrl = `https://www.duolingo.com/2017-06-30/users/${sub}/rewards/${idReward}`;
        const patchBody = {
            consumed: true,
            learningLanguage: userInfo.learningLanguage,
            fromLanguage: userInfo.fromLanguage,
        };
        return await sendRequest({ url: patchUrl, payload: patchBody, method: 'PATCH' });
    }

    async function farmSessionOnce(config = {}) {
        const startTime = config.startTime || getCurrentUnixTimestamp();
        const endTime = config.endTime || startTime + 60;
        const sessionPayload = {
            challengeTypes: [],
            fromLanguage: userInfo.fromLanguage,
            learningLanguage: userInfo.learningLanguage,
            type: 'GLOBAL_PRACTICE',
            ...(config.sessionPayload || {}),
        };
        const sessionRes = await sendRequest({ url: 'https://www.duolingo.com/2017-06-30/sessions', payload: sessionPayload, method: 'POST' });
        const sessionData = await sessionRes.json();
        const updateSessionPayload = {
            id: sessionData.id,
            metadata: sessionData.metadata,
            type: sessionData.type,
            fromLanguage: userInfo.fromLanguage,
            learningLanguage: userInfo.learningLanguage,
            challenges: [],
            adaptiveChallenges: [],
            sessionExperimentRecord: [],
            experiments_with_treatment_contexts: [],
            adaptiveInterleavedChallenges: [],
            sessionStartExperiments: [],
            trackingProperties: [],
            ttsAnnotations: [],
            heartsLeft: 0,
            startTime,
            enableBonusPoints: false,
            endTime,
            failed: false,
            maxInLessonStreak: 9,
            shouldLearnThings: true,
            ...(config.updateSessionPayload || {}),
        };
        return await sendRequest({ url: `https://www.duolingo.com/2017-06-30/sessions/${sessionData.id}`, payload: updateSessionPayload, method: 'PUT' });
    }

    return { farmGemOnce, farmSessionOnce };
}
