import { extractSkillId } from '../utils/utils.js';

export function generateFarmOptions(userInfo) {
	const skillId = extractSkillId(userInfo.currentCourse || {});
	
	return [
		{ type: 'separator', label: '⟡ GEM FARMING ⟡', value: '', disabled: true },
		{ type: 'gem', label: 'Gem 30', value: 'fixed', amount: 30 },
		{ type: 'separator', label: '⟡ XP FARMING ⟡', value: '', disabled: true },
		{ type: 'xp', label: 'XP 10', value: 'xp', amount: 10, config: {} },
		{ type: 'xp', label: 'XP 20', value: 'xp', amount: 20, config: { updateSessionPayload: { hasBoost: true } } },
		{ type: 'xp', label: 'XP 40', value: 'xp', amount: 40, config: { updateSessionPayload: { hasBoost: true, type: 'TARGET_PRACTICE' } } },
		{ type: 'xp', label: 'XP 50', value: 'xp', amount: 50, config: { updateSessionPayload: { enableBonusPoints: true, hasBoost: true, happyHourBonusXp: 10, type: 'TARGET_PRACTICE' } } },
		{ type: 'xp', label: 'XP 110', value: 'xp', amount: 110, config: { sessionPayload: { type: 'UNIT_TEST', skillIds: skillId ? [skillId] : [] }, updateSessionPayload: { type: "UNIT_TEST", hasBoost: true, happyHourBonusXp: 10, pathLevelSpecifics: { unitIndex: 0 } } }, disabled: !skillId },
		{ type: 'separator', label: '⟡ STREAK FARMING ⟡', value: '', disabled: true },
		{ type: 'streak', label: 'Unlimited Streak', value: 'farm' },
		{ type: 'streak', label: 'Repair Streak', value: 'repair' },
	];
}
