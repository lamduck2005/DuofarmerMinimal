import templateRaw from './main.html?raw';
import cssText from './main.css?inline';
import { getUserInfo, createApi } from './api.js';
import { delay, toTimestamp, getJwtToken, decodeJwtToken, logError, log, daysBetween, getCurrentUnixTimestamp } from './utils.js';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './settings.js';

let runtimeSettings = {
	delayTime: 500,
	retryTime: 1000,
	autoStopTime: 0
};

let jwt = null;
let userInfo = null;
let sub = null;
let skillId = null;

let isRunning = false;

let shadowRoot = null;

let apiService = null;
let settings = null;

let farmOptions = [];

let autoStopTimerId = null;

const formatHeaders = (jwtToken) => ({
	'Content-Type': 'application/json',
	Authorization: `Bearer ${jwtToken}`,
	'User-Agent': navigator.userAgent,
});

const extractSkillId = (currentCourse) => {
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

const getElements = () => {
	return {
		startBtn: shadowRoot.getElementById('start-btn'),
		stopBtn: shadowRoot.getElementById('stop-btn'),
		select: shadowRoot.getElementById('select-option'),
		floatingBtn: shadowRoot.getElementById('floating-btn'),
		container: shadowRoot.getElementById('container'),
		overlay: shadowRoot.getElementById('overlay'),
		username: shadowRoot.getElementById('username'),
		streak: shadowRoot.getElementById('streak'),
		gem: shadowRoot.getElementById('gem'),
		xp: shadowRoot.getElementById('xp'),
		settingsBtn: shadowRoot.getElementById('settings-btn'),
		settingsContainer: shadowRoot.getElementById('settings-container'),
		settingsClose: shadowRoot.getElementById('settings-close'),
	};
};

const getSettingsElements = () => ({
	autoOpenUI: shadowRoot.getElementById('auto-open-ui'),
	autoStart: shadowRoot.getElementById('auto-start'),
	defaultOption: shadowRoot.getElementById('default-option'),
	hideUsername: shadowRoot.getElementById('hide-username'),
	keepScreenOn: shadowRoot.getElementById('keep-screen-on'),
	autoStopTime: shadowRoot.getElementById('auto-stop-time'),
	saveSettingsBtn: shadowRoot.getElementById('save-settings'),
	getJwtTokenBtn: shadowRoot.getElementById('get-jwt-token'),
	resetSetting: shadowRoot.getElementById('reset-setting'),
});

const loadSettingsToUI = () => {
	const el = getSettingsElements();
	if (el.autoOpenUI) el.autoOpenUI.checked = settings.autoOpenUI;
	if (el.autoStart) el.autoStart.checked = settings.autoStart;
	if (el.defaultOption) el.defaultOption.value = settings.defaultOption.toString();
	if (el.hideUsername) el.hideUsername.checked = settings.hideUsername;
	if (el.keepScreenOn) el.keepScreenOn.checked = settings.keepScreenOn;
	if (el.autoStopTime) el.autoStopTime.value = settings.autoStopTime;
};

const saveSettingsFromUI = () => {
	const el = getSettingsElements();
	const newSettings = {
		autoOpenUI: el.autoOpenUI?.checked || false,
		autoStart: el.autoStart?.checked || false,
		defaultOption: parseInt(el.defaultOption?.value) || 1,
		hideUsername: el.hideUsername?.checked || false,
		keepScreenOn: el.keepScreenOn?.checked || false,
		autoStopTime: parseInt(el.autoStopTime?.value) || 0,
	};
	settings = newSettings;
	saveSettings(newSettings);
	return newSettings;
};

const populateDefaultOptionSelect = (optionsArray) => {
	const select = shadowRoot.getElementById('default-option');
	select.innerHTML = '';
	optionsArray.forEach((opt, index) => {
		const option = document.createElement('option');
		option.value = index.toString();
		option.textContent = opt.label;
		if (opt.disabled) option.disabled = true;
		select.appendChild(option);
	});
};

const loadDefaultFarmingOption = () => {
	const select = shadowRoot.getElementById('select-option');
	select.selectedIndex = settings.defaultOption;
};

const addEventSettings = (container) => {
	const { settingsBtn, settingsContainer, settingsClose } = getElements();
	const modal = toggleModal(settingsContainer, container);
	settingsBtn.addEventListener('click', modal.show);
	settingsClose.addEventListener('click', modal.hide);
};

const addSettingsEventListeners = () => {
	const el = getSettingsElements();

	el.saveSettingsBtn.addEventListener('click', () => {
		saveSettingsFromUI();
		alert('Settings saved successfully, reload the page to apply changes!');
		confirm('Reload now?') && location.reload();
	});

	el.getJwtTokenBtn.addEventListener('click', () => {
		const token = getJwtToken();
		if (token) {
			confirm(`Your JWT Token:\n\n${token}\n\nCopy to clipboard?`) && navigator.clipboard.writeText(token);
		}
	});

	el.resetSetting.addEventListener('click', () => {
		if (confirm('Reset all settings to default? This cannot be undone.')) {
			localStorage.removeItem('duofarmerSettings');
			settings = { ...DEFAULT_SETTINGS };
			loadSettingsToUI();
			alert('All settings reset successfully! Reload to apply changes.');
		}
	});
};

const setRunningState = (running) => {
	isRunning = running;
	const { startBtn, stopBtn, select } = getElements();
	if (running) {
		startBtn.hidden = true;
		stopBtn.hidden = false;
		stopBtn.disabled = true;
		stopBtn.className = 'disable-btn';
		select.disabled = true;
	} else {
		stopBtn.hidden = true;
		startBtn.hidden = false;
		startBtn.disabled = true;
		startBtn.className = 'disable-btn';
		select.disabled = false;
		if (autoStopTimerId) {
			clearTimeout(autoStopTimerId);
			autoStopTimerId = null;
		}
	}

	setTimeout(() => {
		const { startBtn: btn, stopBtn: stop } = getElements();
		btn.className = '';
		btn.disabled = false;
		stop.className = '';
		stop.disabled = false;
	}, 3000);
};

const disableAllControls = (notifyMessage = null) => {
	const { startBtn, stopBtn, select } = getElements();
	startBtn.disabled = true;
	startBtn.className = 'disable-btn';
	stopBtn.disabled = true;
	select.disabled = true;
	if (notifyMessage) {
		updateNotify(notifyMessage);
	}
};

const initInterface = () => {
	const container = document.createElement('div');
	shadowRoot = container.attachShadow({ mode: 'open' });

	const style = document.createElement('style');
	style.textContent = cssText;
	shadowRoot.appendChild(style);

	const content = document.createElement('div');
	content.innerHTML = templateRaw;
	shadowRoot.appendChild(content);

	document.body.appendChild(container);

	const settingsContainer = shadowRoot.getElementById('settings-container');
	if (settingsContainer) {
		settingsContainer.style.display = 'none';
	}

	const requiredElements = [
		'start-btn', 'stop-btn', 'select-option', 'floating-btn',
		'container', 'overlay',
	];

	for (const id of requiredElements) {
		if (!shadowRoot.getElementById(id)) {
			throw new Error(`Required UI element '${id}' not found in template. Template may be corrupted.`);
		}
	}
};

const showElement = (element) => {
	if (element) element.style.display = 'flex';
};

const hideElement = (element) => {
	if (element) element.style.display = 'none';
};

const toggleModal = (modalElement, mainElement) => {
	return {
		show: () => {
			hideElement(mainElement);
			showElement(modalElement);
		},
		hide: () => {
			hideElement(modalElement);
			showElement(mainElement);
		}
	};
};

const setInterfaceVisible = (visible) => {
	const { container, overlay } = getElements();
	if (visible) {
		showElement(container);
		showElement(overlay);
	} else {
		hideElement(container);
		hideElement(overlay);
	}
};

const addEventFloatingBtn = () => {
	const { floatingBtn } = getElements();
	floatingBtn.addEventListener('click', () => {
		if (isRunning) {
			if (confirm('Duofarmer is farming. Do you want to stop and hide UI?')) {
				setRunningState(false);
				setInterfaceVisible(false);
			}
			return;
		}
		toggleInterface();
	});
};

const addEventStartBtn = () => {
	const { startBtn, select } = getElements();
	startBtn.addEventListener('click', async () => {
		setRunningState(true);

		if (runtimeSettings.autoStopTime > 0) {
			autoStopTimerId = setTimeout(() => {
				alert(`Auto-stopped by setting (stop after ${runtimeSettings.autoStopTime} minutes).`);
				updateNotify(`Auto-stopped by setting (stop after ${runtimeSettings.autoStopTime} minutes).`);
				setRunningState(false);
			}, runtimeSettings.autoStopTime * 60 * 1000);
		}

		const selected = select.options[select.selectedIndex];
		const optionData = {
			type: selected.getAttribute('data-type'),
			amount: Number(selected.getAttribute('data-amount')),
			value: selected.value,
			label: selected.textContent,
			config: selected.getAttribute('data-config') ? JSON.parse(selected.getAttribute('data-config')) : {},
		};
		await farmSelectedOption(optionData);
	});
};

const addEventStopBtn = () => {
	const { stopBtn } = getElements();
	stopBtn.addEventListener('click', () => {
		setRunningState(false);
	});
};

const isInterfaceVisible = () => {
	const { container } = getElements();
	return container.style.display !== 'none' && container.style.display !== '';
};

const toggleInterface = () => {
	setInterfaceVisible(!isInterfaceVisible());
};

const addEventListeners = () => {
	addEventStartBtn();
	addEventStopBtn();
	const { container } = getElements();
	addEventSettings(container);
	addSettingsEventListeners();
};

const populateOptions = () => {
	const select = shadowRoot.getElementById('select-option');
	select.innerHTML = '';
	farmOptions.forEach((opt) => {
		const option = document.createElement('option');
		option.value = opt.value;
		option.textContent = opt.label;
		option.setAttribute('data-type', opt.type);
		if (opt.amount != null) option.setAttribute('data-amount', String(opt.amount));
		if (opt.config) option.setAttribute('data-config', JSON.stringify(opt.config));
		if (opt.disabled) option.disabled = true;
		select.appendChild(option);
	});
};

const updateNotify = (message) => {
	const now = new Date().toLocaleTimeString();
	log(`[${now}] ${message}`);
};

const updateUserInfo = () => {
	const elements = getElements();
	if (userInfo) {
		elements.username.innerText = userInfo.username;
		elements.streak.innerText = userInfo.streak;
		elements.gem.innerText = userInfo.gems;
		elements.xp.innerText = userInfo.totalXp;
	}
};

const updateFarmResult = (type, farmedAmount) => {
	switch (type) {
		case 'gem':
			userInfo = { ...userInfo, gems: userInfo.gems + farmedAmount };
			updateNotify(`You got ${farmedAmount} gem!!!`);
			break;
		case 'xp':
			userInfo = { ...userInfo, totalXp: userInfo.totalXp + farmedAmount };
			updateNotify(`You got ${farmedAmount} XP!!!`);
			break;
		case 'streak':
			userInfo = { ...userInfo, streak: userInfo.streak + farmedAmount };
			updateNotify(`You got ${farmedAmount} streak! (maybe some xp too, idk)`);
			break;
	}
	updateUserInfo();
};

const gemFarmingLoop = async () => {
	const gemFarmed = 30;
	while (isRunning) {
		try {
			await apiService.farmGemOnce();
			updateFarmResult('gem', gemFarmed);
			await delay(runtimeSettings.delayTime);
		} catch (error) {
			updateNotify(`Error ${error.status}! Please report in telegram group!`);
			await delay(runtimeSettings.retryTime);
		}
	}
};

const xpFarmingLoop = async (config = {}) => {
	while (isRunning) {
		try {
			const response = await apiService.farmSessionOnce(config);
			if (response.status > 400) {
				updateNotify(`Something went wrong! Pls try other farming methods.`);
				await delay(runtimeSettings.retryTime);
				continue;
			}
			const responseData = await response.json();
			const xpFarmed = responseData?.awardedXp || responseData?.xpGain || 0;
			updateFarmResult('xp', xpFarmed);
			await delay(runtimeSettings.delayTime);
		} catch (error) {
			updateNotify(`Error ${error.status}! Please report in telegram group!`);
			await delay(runtimeSettings.retryTime);
		}
	}
};

const streakFarmingLoop = async (value = 'farm') => {
	const SECONDS_PER_DAY = 86400;
	const SESSION_DURATION_SECONDS = 60;

	const hasStreak = !!userInfo.streakData.currentStreak;
	const startStreakDate = hasStreak ? userInfo.streakData.currentStreak.startDate : new Date();
	const startFarmStreakTimestamp = toTimestamp(startStreakDate);
	let currentTimestamp = hasStreak ? startFarmStreakTimestamp - SECONDS_PER_DAY : startFarmStreakTimestamp;

	if (value === 'repair') {
		const creationDate = userInfo.creationDate;
		const currentStreak = userInfo.streak || 0;
		const currentTime = getCurrentUnixTimestamp();
		const daysSinceCreation = daysBetween(creationDate, currentTime);
		const maxPossibleStreak = daysSinceCreation + 1;

		if (currentStreak >= maxPossibleStreak) {
			const message = `Current streak (${currentStreak}) is greater than or equal to maximum possible streak (${maxPossibleStreak}). No repair needed.`;
			updateNotify(message);
			setRunningState(false);
			return;
		}

		const endTimestamp = creationDate;
		const missingStreaks = maxPossibleStreak - currentStreak;

		if (missingStreaks <= 0) {
			const message = 'No missing streaks to repair.';
			updateNotify(message);
			setRunningState(false);
			return;
		}

		updateNotify(`Repairing ${missingStreaks} missing streaks...`);

		let repairTimestamp = currentTimestamp;
		let repairedCount = 0;

		while (isRunning && repairTimestamp >= endTimestamp && repairedCount < missingStreaks) {
			try {
				const sessionRes = await apiService.farmSessionOnce({ startTime: repairTimestamp, endTime: repairTimestamp + SESSION_DURATION_SECONDS });
				if (sessionRes) {
					repairTimestamp -= SECONDS_PER_DAY;
					updateFarmResult('streak', 1);
					repairedCount += 1;
					await delay(runtimeSettings.delayTime);
				} else {
					updateNotify("Failed to repair streak session, I'm trying again...");
					await delay(runtimeSettings.retryTime);
					continue;
				}
			} catch (error) {
				updateNotify(`Error in repairStreak: ${error?.message || error}`);
				await delay(runtimeSettings.retryTime);
				continue;
			}
		}

		if (repairedCount >= missingStreaks || repairTimestamp < endTimestamp) {
			const message = `Streak repair completed. Repaired ${repairedCount} day(s).`;
			updateNotify(message);
			setRunningState(false);
		}
	} else {
		while (isRunning) {
			try {
				const sessionRes = await apiService.farmSessionOnce({ startTime: currentTimestamp, endTime: currentTimestamp + SESSION_DURATION_SECONDS });
				if (sessionRes) {
					currentTimestamp -= SECONDS_PER_DAY;
					updateFarmResult('streak', 1);
					await delay(runtimeSettings.delayTime);
				} else {
					updateNotify("Failed to farm streak session, I'm trying again...");
					await delay(runtimeSettings.retryTime);
					continue;
				}
			} catch (error) {
				updateNotify(`Error in farmStreak: ${error?.message || error}`);
				await delay(runtimeSettings.retryTime);
				continue;
			}
		}
	}
};

const farmSelectedOption = async (option) => {
	const { type, value, amount, config } = option;
	switch (type) {
		case 'gem':
			gemFarmingLoop();
			break;
		case 'xp':
			xpFarmingLoop(config);
			break;
		case 'streak':
			streakFarmingLoop(value);
			break;
	}
};

const loadSavedSettings = () => {
	runtimeSettings = { ...runtimeSettings, ...settings };

	const elements = getElements();
	if (settings.autoOpenUI) {
		setInterfaceVisible(true);
	}
	if (settings.autoStart) {
		setInterfaceVisible(true);
		elements.startBtn.click();
	}
	if (settings.hideUsername) {
		elements.username.classList.add('blur');
	}
	if (settings.keepScreenOn && 'wakeLock' in navigator) {
		navigator.wakeLock.request('screen').then(() => {
			log('Screen wake lock active');
		});
	}
};

const initVariables = async () => {
	jwt = getJwtToken();
	if (!jwt) {
		disableAllControls('Please login to Duolingo and reload!');
		return;
	}
	const headers = formatHeaders(jwt);
	const decodedJwt = decodeJwtToken(jwt);
	sub = decodedJwt.sub;
	userInfo = await getUserInfo(sub, headers);

	apiService = createApi(jwt, userInfo);

	skillId = extractSkillId(userInfo.currentCourse || {});
	farmOptions = [
		{ type: 'separator', label: '── GEM ──', value: '', disabled: true },
		{ type: 'gem', label: 'Gem x30', value: 'fixed', amount: 30 },
		{ type: 'separator', label: '── XP ──', value: '', disabled: true },
		{ type: 'xp', label: 'XP 10', value: 'session', amount: 10, config: {} },
		{ type: 'xp', label: 'XP 20', value: 'session', amount: 20, config: { updateSessionPayload: { hasBoost: true } } },
		{ type: 'xp', label: 'XP 40', value: 'session', amount: 40, config: { updateSessionPayload: { hasBoost: true, type: 'TARGET_PRACTICE' } } },
		{ type: 'xp', label: 'XP 50', value: 'session', amount: 50, config: { updateSessionPayload: { enableBonusPoints: true, hasBoost: true, happyHourBonusXp: 10, type: 'TARGET_PRACTICE' } } },
		{ type: 'xp', label: 'XP 110 (Unit Test)', value: 'session', amount: 110, config: { sessionPayload: { type: 'UNIT_TEST', skillIds: skillId ? [skillId] : [] }, updateSessionPayload: { type: "UNIT_TEST", hasBoost: true, happyHourBonusXp: 10, pathLevelSpecifics: { unitIndex: 0 } } }, disabled: !skillId },
		{ type: 'separator', label: '── STREAK ──', value: '', disabled: true },
		{ type: 'streak', label: 'Farm (unlimited)', value: 'farm' },
		{ type: 'streak', label: 'Repair streak', value: 'repair' },
	];
};

const initSettings = () => {
	settings = loadSettings();
	populateDefaultOptionSelect(farmOptions);
	loadDefaultFarmingOption();
	loadSettingsToUI();
};


(async () => {
	try {
		initInterface();
		setInterfaceVisible(false);
		addEventFloatingBtn();
		await initVariables();
		populateOptions();
		initSettings();
		updateUserInfo();
		addEventListeners();
		loadSavedSettings();
		updateNotify('Duofarmer ready! For safety, I suggest that you use 2nd accounts.');
	} catch (err) {
		logError(err, 'Duofarmer init error!');
	}
})();
