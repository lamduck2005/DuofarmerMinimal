import { getCurrentUnixTimestamp } from '../utils/utils.js';

export class ApiService {
    constructor(jwt, defaultHeaders, userInfo, sub) {
        this.jwt = jwt;
        this.defaultHeaders = defaultHeaders;
        this.userInfo = userInfo;
        this.sub = sub;
    }

    static async getUserInfo(userSub, headers) {
        const userInfoUrl = `https://www.duolingo.com/2017-06-30/users/${userSub}?fields=id,username,fromLanguage,learningLanguage,streak,totalXp,level,numFollowers,numFollowing,gems,creationDate,streakData,privacySettings,currentCourse{pathSectioned{units{levels{pathLevelMetadata{skillId}}}}}`;
        const response = await fetch(userInfoUrl, { method: 'GET', headers });
        return await response.json();
    }

    async sendRequest({ url, payload, headers, method = 'PUT' }) {
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
    }

    async setPrivacyStatus(privacyStatus) {
        const patchUrl = `https://www.duolingo.com/2017-06-30/users/${this.sub}/privacy-settings?fields=privacySettings`;
        const patchBody = {
            "DISABLE_SOCIAL": privacyStatus
        }
        return await this.sendRequest({ url: patchUrl, payload: patchBody, headers: this.defaultHeaders, method: 'PATCH' });
    }

    async farmGemOnce() {
        const idReward = 'SKILL_COMPLETION_BALANCED-dd2495f4_d44e_3fc3_8ac8_94e2191506f0-2-GEMS';
        const patchUrl = `https://www.duolingo.com/2017-06-30/users/${this.sub}/rewards/${idReward}`;
        const patchBody = {
            consumed: true,
            learningLanguage: this.userInfo.learningLanguage,
            fromLanguage: this.userInfo.fromLanguage,
        };
        return await this.sendRequest({ url: patchUrl, payload: patchBody, headers: this.defaultHeaders, method: 'PATCH' });
    }

    async farmStoryOnce(config = {}) {
        const startTime = getCurrentUnixTimestamp();
        const fromLanguage = this.userInfo.fromLanguage;
        const completeUrl = `https://stories.duolingo.com/api2/stories/en-${fromLanguage}-the-passport/complete`;
        const storyPayload = {
            awardXp: true,
            isFeaturedStoryInPracticeHub: false,
            completedBonusChallenge: true,
            mode: 'READ',
            isV2Redo: false,
            isV2Story: false,
            isLegendaryMode: true,
            masterVersion: false,
            maxScore: 0,
            numHintsUsed: 0,
            score: 0,
            startTime: startTime,
            fromLanguage: fromLanguage,
            learningLanguage: this.userInfo.learningLanguage,
            hasXpBoost: false,
            // happyHourBonusXp: 449,
            ...(config.storyPayload || {}),
        };
        return await this.sendRequest({ url: completeUrl, payload: storyPayload, headers: this.defaultHeaders, method: 'POST' });
    }

    async farmSessionOnce(config = {}) {
        const startTime = config.startTime || getCurrentUnixTimestamp();
        const endTime = config.endTime || startTime + 60;
        const sessionPayload = {
            challengeTypes: [],
            fromLanguage: this.userInfo.fromLanguage,
            learningLanguage: this.userInfo.learningLanguage,
            // isFinalLevel: false,
            // isV2: true,
            // juicy: true,
            // smartTipsVersion: 2,
            type: 'GLOBAL_PRACTICE',
            ...(config.sessionPayload || {}),
        };
        const sessionRes = await this.sendRequest({ url: 'https://www.duolingo.com/2017-06-30/sessions', payload: sessionPayload, headers: this.defaultHeaders, method: 'POST' });
        const sessionData = await sessionRes.json();
        const updateSessionPayload = {
            // ...sessionData,
            id: sessionData.id,
            metadata: sessionData.metadata,
            type: sessionData.type,
            fromLanguage: this.userInfo.fromLanguage,
            learningLanguage: this.userInfo.learningLanguage,
            challenges: [], // empty for fast response
            adaptiveChallenges: [], // empty for fast response
            sessionExperimentRecord: [],
            experiments_with_treatment_contexts: [],
            adaptiveInterleavedChallenges: [],
            adaptiveChallenges: [],
            sessionStartExperiments: [],
            trackingProperties: [],
            ttsAnnotations: [],
            heartsLeft: 0,
            startTime: startTime,
            enableBonusPoints: false,
            endTime: endTime,
            failed: false,
            maxInLessonStreak: 9,
            shouldLearnThings: true,
            ...(config.updateSessionPayload || {}),
        };
        const updateRes = await this.sendRequest({ url: `https://www.duolingo.com/2017-06-30/sessions/${sessionData.id}`, payload: updateSessionPayload, headers: this.defaultHeaders, method: 'PUT' });
        return updateRes;
    }
}