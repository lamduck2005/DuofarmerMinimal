import { extractSkillId } from '../utils/utils.js';

export function generateFarmOptions(userInfo) {
	const skillId = extractSkillId(userInfo.currentCourse || {});
	
	return [
		{ type: 'separator', label: '⟡ GEM FARMING ⟡', value: '', disabled: true },
		{ type: 'gem', label: 'Gem 30', value: 'fixed', amount: 30 },
		{ type: 'separator', label: '⟡ XP SESSION FARMING ⟡', value: '', disabled: true },
		{ type: 'separator', label: '(slow, safe, any language)', value: '', disabled: true },
		{ type: 'xp', label: 'XP 10', value: 'session', amount: 10, config: {} },
		{ type: 'xp', label: 'XP 20', value: 'session', amount: 20, config: { updateSessionPayload: { hasBoost: true } } },
		{ type: 'xp', label: 'XP 40', value: 'session', amount: 40, config: { updateSessionPayload: { hasBoost: true, type: 'TARGET_PRACTICE' } } },
		{ type: 'xp', label: 'XP 50', value: 'session', amount: 50, config: { updateSessionPayload: { enableBonusPoints: true, hasBoost: true, happyHourBonusXp: 10, type: 'TARGET_PRACTICE' } } },
		{ type: 'xp', label: 'XP 110', value: 'session', amount: 110, config: { sessionPayload: { type: 'UNIT_TEST', skillIds: skillId ? [skillId] : [] }, updateSessionPayload: { type: "UNIT_TEST", hasBoost: true, happyHourBonusXp: 10, pathLevelSpecifics: { unitIndex: 0 } } }, disabled: !skillId },
		{ type: 'separator', label: '⟡ XP STORY FARMING ⟡', value: '', disabled: true },
		{ type: 'separator', label: '(fast, unsafe, English only) ', value: '', disabled: true },
		{ type: 'xp', label: 'XP 50', value: 'story', amount: 50, config: {} },
		{ type: 'xp', label: 'XP 100 ', value: 'story', amount: 100, config: { storyPayload: { happyHourBonusXp: 50 } } },
		{ type: 'xp', label: 'XP 200 ', value: 'story', amount: 200, config: { storyPayload: { happyHourBonusXp: 150 } } },
		{ type: 'xp', label: 'XP 300 ', value: 'story', amount: 300, config: { storyPayload: { happyHourBonusXp: 250 } } },
		{ type: 'xp', label: 'XP 400 ', value: 'story', amount: 400, config: { storyPayload: { happyHourBonusXp: 350 } } },
		{ type: 'xp', label: 'XP 499 ', value: 'story', amount: 499, config: { storyPayload: { happyHourBonusXp: 449 } } },
		{ type: 'separator', label: '⟡ STREAK FARMING ⟡', value: '', disabled: true },
		{ type: 'streak', label: 'Nonstop farm (unlimited)', value: 'farm' },
		{ type: 'streak', label: 'Repair streak (from account creation)', value: 'repair' },
	];
}
