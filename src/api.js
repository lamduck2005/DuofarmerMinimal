import { getCurrentUnixTimestamp } from './utils.js';

const FIELDS = [
    'id', 'username', 'fromLanguage', 'learningLanguage',
    'streak', 'totalXp', 'gems', 'creationDate', 'picture',
    'level', 'numFollowers', 'numFollowing', 'privacySettings',
    'streakData{currentStreak,longestStreak,previousStreak}',
    'currentCourse{pathSectioned{units{levels{pathLevelMetadata{skillId},pathLevelClientData{skillId}}}}}',
].join(',');

const API_VERSIONS = ['2023-05-23', '2017-06-30'];

export async function getUserInfo(sub, headers) {
    let data = null;
    for (const version of API_VERSIONS) {
        try {
            const url = `https://www.duolingo.com/${version}/users/${sub}?fields=${FIELDS}`;
            const res = await fetch(url, { method: 'GET', headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            data = await res.json();
            break;
        } catch (err) {
            GM_log(`[getUserInfo] ${version} failed: ${err.message}`);
        }
    }
    if (!data) throw new Error('All API versions failed');

    if (data.picture) {
        let pic = data.picture.startsWith('//') ? 'https:' + data.picture : data.picture;
        pic = pic + '/medium'; // size: medium | small | large
        data.picture = pic;
    }

    const streakFromField = data.streak;
    const streakFromData = data.streakData?.currentStreak?.length;
    if (streakFromData !== undefined && streakFromField !== streakFromData) {
        GM_log(`[getUserInfo] streak mismatch: streak=${streakFromField}, currentStreak.length=${streakFromData}, using streak field`);
        data.streak = streakFromField;
    }

    return data;
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
