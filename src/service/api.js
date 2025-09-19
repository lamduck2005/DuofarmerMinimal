import { getCurrentUnixTimestamp } from '../utils/utils.js';

export class ApiService {
    constructor(jwt, defaultHeaders, userInfo, sub) {
        this.jwt = jwt;
        this.defaultHeaders = defaultHeaders;
        this.userInfo = userInfo;
        this.sub = sub;
    }

    static async getUserInfo(userSub, headers) {
        const userInfoUrl = `https://www.duolingo.com/2017-06-30/users/${userSub}?fields=id,username,fromLanguage,learningLanguage,streak,totalXp,level,numFollowers,numFollowing,gems,creationDate,streakData`;
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

    async farmGemOnce() {
        const idReward = 'SKILL_COMPLETION_BALANCED-dd2495f4_d44e_3fc3_8ac8_94e2191506f0-2-GEMS';
        const patchUrl = `https://www.duolingo.com/2017-06-30/users/${this.sub}/rewards/${idReward}`;
        const patchData = {
            consumed: true,
            learningLanguage: this.userInfo.learningLanguage,
            fromLanguage: this.userInfo.fromLanguage,
        };
        return await this.sendRequest({ url: patchUrl, payload: patchData, headers: this.defaultHeaders, method: 'PATCH' });
    }

    async farmStoryOnce(amount) {
        const startTime = getCurrentUnixTimestamp();
        const fromLanguage = this.userInfo.fromLanguage;
        const completeUrl = `https://stories.duolingo.com/api2/stories/en-${fromLanguage}-the-passport/complete`;
        const payload = {
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
            learningLanguage: 'en',
            hasXpBoost: false,
            happyHourBonusXp: 449,
        };
        return await this.sendRequest({ url: completeUrl, payload, headers: this.defaultHeaders, method: 'POST' });
    }

    async farmSessionOnce(startTime = getCurrentUnixTimestamp(), endTime = startTime + 60) {
        const sessionPayload = {
            challengeTypes: [
                'assist', 'characterIntro', 'characterMatch', 'characterPuzzle', 'characterSelect', 'characterTrace', 'characterWrite',
                'completeReverseTranslation', 'definition', 'dialogue', 'extendedMatch', 'extendedListenMatch', 'form', 'freeResponse',
                'gapFill', 'judge', 'listen', 'listenComplete', 'listenMatch', 'match', 'name', 'listenComprehension', 'listenIsolation',
                'listenSpeak', 'listenTap', 'orderTapComplete', 'partialListen', 'partialReverseTranslate', 'patternTapComplete',
                'radioBinary', 'radioImageSelect', 'radioListenMatch', 'radioListenRecognize', 'radioSelect', 'readComprehension',
                'reverseAssist', 'sameDifferent', 'select', 'selectPronunciation', 'selectTranscription', 'svgPuzzle', 'syllableTap',
                'syllableListenTap', 'speak', 'tapCloze', 'tapClozeTable', 'tapComplete', 'tapCompleteTable', 'tapDescribe',
                'translate', 'transliterate', 'transliterationAssist', 'typeCloze', 'typeClozeTable', 'typeComplete', 'typeCompleteTable',
                'writeComprehension',
            ],
            fromLanguage: this.userInfo.fromLanguage,
            isFinalLevel: false,
            isV2: true,
            juicy: true,
            learningLanguage: this.userInfo.learningLanguage,
            smartTipsVersion: 2,
            type: 'GLOBAL_PRACTICE',
        };
        const sessionRes = await this.sendRequest({ url: 'https://www.duolingo.com/2017-06-30/sessions', payload: sessionPayload, headers: this.defaultHeaders, method: 'POST' });
        const sessionData = await sessionRes.json();
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
        const updateRes = await this.sendRequest({ url: `https://www.duolingo.com/2017-06-30/sessions/${sessionData.id}`, payload: updateSessionPayload, headers: this.defaultHeaders, method: 'PUT' });
        return updateRes;
    }
}