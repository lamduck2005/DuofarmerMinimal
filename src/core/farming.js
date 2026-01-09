import { toTimestamp, getCurrentUnixTimestamp, daysBetween } from '../utils/utils.js';
import { log } from '../platform/ui.js';

// Helper functions
const safeCall = (callback, ...args) => callback?.(...args);

const handleFarmingError = (error, context, callbacks) => {
	const message = error?.status 
		? `Error ${error.status}! Please report in telegram group!`
		: `Error in ${context}: ${error?.message || error}`;
	safeCall(callbacks.onError, message);
	return message;
};

// Farming Strategies Map
const FARMING_STRATEGIES = {
	gem: (apiService, config, callbacks) => new GemFarming(apiService, config, callbacks),
	xp: (apiService, config, callbacks) => new XpFarming(apiService, config, callbacks),
	streak: (apiService, config, callbacks) => new StreakFarming(apiService, config, callbacks)
};


export class GemFarming {
	constructor(apiService, config, callbacks) {
		this.apiService = apiService;
		this.config = config;
		this.callbacks = callbacks;
		this.gemFarmed = 30;
	}

	async start(userInfo) {
		while (this.config.isRunning) {
			try {
				await this.apiService.farmGemOnce(userInfo);
				safeCall(this.callbacks.onUpdate, 'gem', this.gemFarmed);
				await this.callbacks.delay(this.config.delayTime);
			} catch (error) {
				handleFarmingError(error, 'gemFarming', this.callbacks);
				await this.callbacks.delay(this.config.retryTime);
			}
		}
	}
}

export class XpFarming {
	constructor(apiService, config, callbacks) {
		this.apiService = apiService;
		this.config = config;
		this.callbacks = callbacks;
	}

	async start(value, amount, config = {}, userInfo) {
		while (this.config.isRunning) {
			try {
				const response = await this.apiService.farmSessionOnce(config);
				
				if (response.status > 400) {
					safeCall(this.callbacks.onError, `Something went wrong! Please try again later.`);
					await this.callbacks.delay(this.config.retryTime);
					continue;
				}
				
				const responseData = await response.json();
				const xpFarmed = responseData?.awardedXp || responseData?.xpGain || 0;
				
				safeCall(this.callbacks.onUpdate, 'xp', xpFarmed);
				await this.callbacks.delay(this.config.delayTime);
			} catch (error) {
				handleFarmingError(error, 'xpFarming', this.callbacks);
				await this.callbacks.delay(this.config.retryTime);
			}
		}
	}
}

export class StreakFarming {
	constructor(apiService, config, callbacks) {
		this.apiService = apiService;
		this.config = config;
		this.callbacks = callbacks;
		this.SECONDS_PER_DAY = 86400;
		this.SESSION_DURATION_SECONDS = 60;
	}

	async start(value = 'farm', userInfo) {
		const method = value === 'repair' ? this.repair.bind(this) : this.farm.bind(this);
		await method(userInfo);
	}

	async farm(userInfo) {
		const hasStreak = !!userInfo.streakData.currentStreak;
		const startStreakDate = hasStreak ? userInfo.streakData.currentStreak.startDate : new Date();
		const startFarmStreakTimestamp = toTimestamp(startStreakDate);
		let currentTimestamp = hasStreak ? startFarmStreakTimestamp - this.SECONDS_PER_DAY : startFarmStreakTimestamp;

		while (this.config.isRunning) {
			try {
				const sessionRes = await this.apiService.farmSessionOnce({
					startTime: currentTimestamp,
					endTime: currentTimestamp + this.SESSION_DURATION_SECONDS
				});
				
				if (sessionRes) {
					currentTimestamp -= this.SECONDS_PER_DAY;
					safeCall(this.callbacks.onUpdate, 'streak', 1);
					await this.callbacks.delay(this.config.delayTime);
				} else {
					safeCall(this.callbacks.onError, "Failed to farm streak session, I'm trying again...");
					await this.callbacks.delay(this.config.retryTime);
					continue;
				}
			} catch (error) {
				handleFarmingError(error, 'farmStreak', this.callbacks);
				await this.callbacks.delay(this.config.retryTime);
				continue;
			}
		}
	}

	validateRepair(userInfo) {
		const creationDate = userInfo.creationDate;
		const currentStreak = userInfo.streak || 0;
		const currentTime = getCurrentUnixTimestamp();
		
		const hasStreak = !!userInfo.streakData?.currentStreak?.startDate;
		const startStreakDate = hasStreak ? userInfo.streakData.currentStreak.startDate : null;
		const startStreakTimestamp = startStreakDate ? toTimestamp(startStreakDate) : null;
		
		let baseTimestamp;
		let baseSource;
		if (startStreakTimestamp && startStreakTimestamp < creationDate) {
			baseTimestamp = startStreakTimestamp;
			baseSource = 'startStreakDate';
		} else {
			baseTimestamp = creationDate;
			baseSource = 'creationDate';
		}
		
		const daysSinceBase = daysBetween(baseTimestamp, currentTime);
		const maxPossibleStreak = daysSinceBase + 1;
		const missingStreaks = maxPossibleStreak - currentStreak;

		log(`[RepairStreak] validateRepair - creationDate: ${creationDate}`);
		log(`[RepairStreak] validateRepair - startStreakDate: ${startStreakDate}`);
		log(`[RepairStreak] validateRepair - startStreakTimestamp: ${startStreakTimestamp}`);
		log(`[RepairStreak] validateRepair - baseTimestamp: ${baseTimestamp} (source: ${baseSource})`);
		log(`[RepairStreak] validateRepair - currentStreak: ${currentStreak}`);
		log(`[RepairStreak] validateRepair - currentTime: ${currentTime}`);
		log(`[RepairStreak] validateRepair - daysSinceBase: ${daysSinceBase}`);
		log(`[RepairStreak] validateRepair - maxPossibleStreak: ${maxPossibleStreak}`);
		log(`[RepairStreak] validateRepair - missingStreaks: ${missingStreaks}`);

		if (currentStreak >= maxPossibleStreak) {
			return {
				valid: false,
				message: `Current streak (${currentStreak}) is greater than or equal to maximum possible streak (${maxPossibleStreak}). No repair needed.`
			};
		}

		if (missingStreaks <= 0) {
			return {
				valid: false,
				message: 'No missing streaks to repair.'
			};
		}

		return {
			valid: true,
			missingStreaks,
			endTimestamp: baseTimestamp,
			maxPossibleStreak
		};
	}

	async repair(userInfo) {
		const validation = this.validateRepair(userInfo);
		
		if (!validation.valid) {
			safeCall(this.callbacks.onNotify, validation.message);
			safeCall(this.callbacks.onStop);
			return;
		}

		const { endTimestamp } = validation;
		const currentStreak = userInfo.streak || 0;
		const currentTime = getCurrentUnixTimestamp();

		const hasStreak = !!userInfo.streakData.currentStreak;
		const startStreakDate = hasStreak ? userInfo.streakData.currentStreak.startDate : null;
		const startFarmStreakTimestamp = startStreakDate ? toTimestamp(startStreakDate) : null;
		
		let actualMaxPossibleStreak;
		let actualEndTimestamp;
		
		if (startFarmStreakTimestamp) {
			actualMaxPossibleStreak = daysBetween(startFarmStreakTimestamp, currentTime) + 1;
			actualEndTimestamp = startFarmStreakTimestamp;
			log(`[RepairStreak] repair - using startStreakDate for maxPossibleStreak`);
		} else {
			actualMaxPossibleStreak = validation.maxPossibleStreak;
			actualEndTimestamp = endTimestamp;
			log(`[RepairStreak] repair - using creationDate for maxPossibleStreak`);
		}
		
		const actualMissingStreaks = actualMaxPossibleStreak - currentStreak;

		if(!confirm(`This feature will run ${actualMaxPossibleStreak} sessions to repair ${actualMissingStreaks} missing streaks. Your streak will be ${actualMaxPossibleStreak} days. Are you sure you want to continue?`)) {
			const message = `Streak repair cancelled.`;
			safeCall(this.callbacks.onNotify, message);
			safeCall(this.callbacks.onStop);
			return;
		}

		safeCall(this.callbacks.onNotify, `Starting repair: ${actualMaxPossibleStreak} sessions to run...`);

		let repairTimestamp = currentTime - this.SECONDS_PER_DAY;
		let repairedCount = 0;

		log(`[RepairStreak] repair - hasStreak: ${hasStreak}`);
		log(`[RepairStreak] repair - startStreakDate: ${startStreakDate} (type: ${typeof startStreakDate})`);
		log(`[RepairStreak] repair - startFarmStreakTimestamp: ${startFarmStreakTimestamp}`);
		log(`[RepairStreak] repair - currentStreak: ${currentStreak}`);
		log(`[RepairStreak] repair - actualMaxPossibleStreak: ${actualMaxPossibleStreak}`);
		log(`[RepairStreak] repair - actualMissingStreaks: ${actualMissingStreaks}`);
		log(`[RepairStreak] repair - repairTimestamp (start): ${repairTimestamp}`);
		log(`[RepairStreak] repair - actualEndTimestamp: ${actualEndTimestamp}`);
		log(`[RepairStreak] repair - isRunning: ${this.config.isRunning}`);
		log(`[RepairStreak] repair - condition check: repairTimestamp >= actualEndTimestamp = ${repairTimestamp >= actualEndTimestamp}`);
		log(`[RepairStreak] repair - condition check: repairedCount < actualMaxPossibleStreak = ${repairedCount < actualMaxPossibleStreak}`);

		while (this.config.isRunning && repairTimestamp >= actualEndTimestamp && repairedCount < actualMaxPossibleStreak) {
			try {
				const sessionRes = await this.apiService.farmSessionOnce({
					startTime: repairTimestamp,
					endTime: repairTimestamp + this.SESSION_DURATION_SECONDS
				});
				
				if (sessionRes) {
					repairTimestamp -= this.SECONDS_PER_DAY;
					repairedCount += 1;
					safeCall(this.callbacks.onNotify, `Repairing ${repairedCount} / ${actualMaxPossibleStreak} streaks...`);
					await this.callbacks.delay(this.config.delayTime);
				} else {
					safeCall(this.callbacks.onError, "Failed to repair streak session, I'm trying again...");
					await this.callbacks.delay(this.config.retryTime);
					continue;
				}
			} catch (error) {
				handleFarmingError(error, 'repairStreak', this.callbacks);
				await this.callbacks.delay(this.config.retryTime);
				continue;
			}
		}

		log(`[RepairStreak] repair - loop ended`);
		log(`[RepairStreak] repair - final repairTimestamp: ${repairTimestamp}`);
		log(`[RepairStreak] repair - final repairedCount: ${repairedCount}`);
		log(`[RepairStreak] repair - isRunning after loop: ${this.config.isRunning}`);

		if (repairedCount > 0) {
			safeCall(this.callbacks.onUpdate, 'streak', actualMissingStreaks);
		}
		
		if (repairedCount >= actualMaxPossibleStreak || repairTimestamp < actualEndTimestamp) {
			const message = `Streak repair completed. Repaired ${repairedCount} day(s). Your streak is now ${actualMaxPossibleStreak}.`;
			safeCall(this.callbacks.onNotify, message);
			safeCall(this.callbacks.onStop);
		}
	}
}

export class FarmingController {
	constructor(apiService, config, callbacks) {
		this.apiService = apiService;
		this.config = config;
		this.callbacks = callbacks;
		this.isRunning = false;
		this.autoStopTimerId = null;
		this.currentFarming = null;
	}

	getIsRunning() {
		return this.isRunning;
	}

	setIsRunning(running) {
		this.isRunning = running;
		if (!running && this.autoStopTimerId) {
			clearTimeout(this.autoStopTimerId);
			this.autoStopTimerId = null;
		}
	}

	startAutoStopTimer(autoStopTimeMinutes) {
		if (autoStopTimeMinutes > 0) {
			this.autoStopTimerId = setTimeout(() => {
				const message = `Auto-stopped by setting (stop after ${autoStopTimeMinutes} minutes).`;
				safeCall(this.callbacks.onNotify, message);
				safeCall(this.callbacks.onAlert, message);
				this.stop();
			}, autoStopTimeMinutes * 60 * 1000);
		}
	}

	async start(option, userInfo) {
		if (this.isRunning) {
			return;
		}

		this.setIsRunning(true);
		this.startAutoStopTimer(this.config.autoStopTime);

		const { type, value, amount, config } = option;

		try {
			const strategy = FARMING_STRATEGIES[type];
			if (!strategy) {
				throw new Error(`Unknown farming type: ${type}`);
			}

			this.currentFarming = strategy(this.apiService, this.config, this.callbacks);
			
			if (type === 'xp') {
				await this.currentFarming.start(value, amount, config, userInfo);
			} else if (type === 'streak') {
				await this.currentFarming.start(value, userInfo);
			} else {
				await this.currentFarming.start(userInfo);
			}
		} catch (error) {
			handleFarmingError(error, 'FarmingController.start', this.callbacks);
		} finally {
			this.setIsRunning(false);
		}
	}

	stop() {
		this.setIsRunning(false);
		this.currentFarming = null;
	}
}

