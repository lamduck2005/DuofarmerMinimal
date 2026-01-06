import { toTimestamp, getCurrentUnixTimestamp, daysBetween } from '../utils/utils.js';

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

// XP Farming Methods Map
const XP_FARMING_METHODS = {
	session: (apiService, config) => apiService.farmSessionOnce(config),
	story: (apiService, config) => apiService.farmStoryOnce(config)
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
		const farmMethod = XP_FARMING_METHODS[value];
		if (!farmMethod) {
			safeCall(this.callbacks.onError, `Unknown XP farming method: ${value}`);
			return;
		}

		while (this.config.isRunning) {
			try {
				const response = await farmMethod(this.apiService, config);
				
				if (response.status > 400) {
					safeCall(this.callbacks.onError, `Something went wrong! Pls try other farming methods.\nIf you are using story method, u should try with English course!`);
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
		const daysSinceCreation = daysBetween(creationDate, currentTime);
		const maxPossibleStreak = daysSinceCreation + 1;
		const missingStreaks = maxPossibleStreak - currentStreak;

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
			endTimestamp: creationDate,
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

		const { missingStreaks, endTimestamp } = validation;
		safeCall(this.callbacks.onNotify, `Repairing ${missingStreaks} missing streaks...`);

		const hasStreak = !!userInfo.streakData.currentStreak;
		const startStreakDate = hasStreak ? userInfo.streakData.currentStreak.startDate : new Date();
		const startFarmStreakTimestamp = toTimestamp(startStreakDate);
		let repairTimestamp = hasStreak ? startFarmStreakTimestamp - this.SECONDS_PER_DAY : startFarmStreakTimestamp;
		let repairedCount = 0;

		while (this.config.isRunning && repairTimestamp >= endTimestamp && repairedCount < missingStreaks) {
			try {
				const sessionRes = await this.apiService.farmSessionOnce({
					startTime: repairTimestamp,
					endTime: repairTimestamp + this.SESSION_DURATION_SECONDS
				});
				
				if (sessionRes) {
					repairTimestamp -= this.SECONDS_PER_DAY;
					safeCall(this.callbacks.onUpdate, 'streak', 1);
					repairedCount += 1;
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

		if (repairedCount >= missingStreaks || repairTimestamp < endTimestamp) {
			const message = `Streak repair completed. Repaired ${repairedCount} day(s).`;
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

