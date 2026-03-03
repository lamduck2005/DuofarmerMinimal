import templateRaw from './main.html?raw';
import cssText from './main.css?inline';
import { ApiService } from './service/api.js';
import { delay, toTimestamp, getJwtToken, decodeJwtToken, formatHeaders, logError, log, extractSkillId, daysBetween, getCurrentUnixTimestamp } from './utils/utils.js';
import { SettingsManager } from './settings/settings-manager.js';

let runtimeSettings = {
	delayTime: 500,
	retryTime: 1000,
	autoStopTime: 0
};

let jwt = null
let defaultHeaders = null
let userInfo = null
let sub = null
let skillId = null

let isRunning = false;

let shadowRoot = null;

let apiService = null;
let settingsManager = null;

let farmOptions = []; // Will be set in initVariables

let autoStopTimerId = null;



const getElements = () => {
	return {
		startBtn: shadowRoot.getElementById('start-btn'),
		stopBtn: shadowRoot.getElementById('stop-btn'),
		select: shadowRoot.getElementById('select-option'),
		floatingBtn: shadowRoot.getElementById('floating-btn'),
		container: shadowRoot.getElementById('container'),
		overlay: shadowRoot.getElementById('overlay'),
		notify: shadowRoot.getElementById('notify'),
		username: shadowRoot.getElementById('username'),
		from: shadowRoot.getElementById('from'),
		learn: shadowRoot.getElementById('learn'),
		streak: shadowRoot.getElementById('streak'),
		gem: shadowRoot.getElementById('gem'),
		xp: shadowRoot.getElementById('xp'),
		settingsBtn: shadowRoot.getElementById('settings-btn'),
		settingsContainer: shadowRoot.getElementById('settings-container'),
		settingsClose: shadowRoot.getElementById('settings-close'),
		userInfoDisplay: shadowRoot.getElementById('user-info-display'),
		setAccountPublic: shadowRoot.getElementById('set-account-public'),
		setAccountPrivate: shadowRoot.getElementById('set-account-private'),
	};
};

const setRunningState = (running) => {
	isRunning = running;
	const { startBtn, stopBtn, select } = getElements();
	if (running) {
		startBtn.hidden = true;
		stopBtn.hidden = false;
		stopBtn.disabled = true;
		stopBtn.classList.add('disable-btn');
		select.disabled = true;
	} else {
		stopBtn.hidden = true;
		startBtn.hidden = false;
		startBtn.disabled = true;
		startBtn.classList.add('disable-btn');
		select.disabled = false;
		// Xóa timer khi dừng
		if (autoStopTimerId) {
			clearTimeout(autoStopTimerId);
			autoStopTimerId = null;
		}
	}

	setTimeout(() => {
		const { startBtn: btn, stopBtn: stop } = getElements();
		btn.classList.remove('disable-btn');
		btn.disabled = false;
		stop.classList.remove('disable-btn');
		stop.disabled = false;
	}, 3000);
};

const disableAllControls = (notifyMessage = null) => {
	const { startBtn, stopBtn, select } = getElements();
	startBtn.disabled = true;
	startBtn.classList.add('disable-btn');
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

	// Hide settings container initially
	const settingsContainer = shadowRoot.getElementById('settings-container');
	if (settingsContainer) {
		settingsContainer.style.display = 'none';
	}

	// Validate required elements exist
	const requiredElements = [
		'start-btn', 'stop-btn', 'select-option', 'floating-btn',
		'container', 'overlay', 'notify'
	];

	for (const id of requiredElements) {
		if (!shadowRoot.getElementById(id)) {
			throw new Error(`Required UI element '${id}' not found in template. Template may be corrupted.`);
		}
	}
};

// UI toggle helpers
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

		// Logic auto-stop dựa trên runtimeSettings
		if (runtimeSettings.autoStopTime > 0) {
			autoStopTimerId = setTimeout(() => {
				alert(`Auto-stopped by setting (stop after ${runtimeSettings.autoStopTime} minutes).`);
				updateNotify(`Auto-stopped by setting (stop after ${runtimeSettings.autoStopTime} minutes).`);
				setRunningState(false);
			}, runtimeSettings.autoStopTime * 60 * 1000);
		}

		const idx = Number(select.value);
		const opt = farmOptions[idx];
		if (!opt) return;
		const optionData = {
			type: opt.type,
			amount: opt.amount != null ? Number(opt.amount) : 0,
			value: opt.value || '',
			label: opt.label,
			config: opt.config || {},
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
	settingsManager.addEventSettings(container);
	settingsManager.addEventListeners();
};

const populateOptions = () => {
	const select = shadowRoot.getElementById('select-option');
	select.innerHTML = '';
	const typeColors = { gem: '#c084fc', xp: '#38bdf8', streak: '#fb923c', separator: '#6b7280' };

	farmOptions.forEach((opt, idx) => {
		const option = document.createElement('option');
		option.value = String(idx);
		option.textContent = opt.label;
		option.disabled = opt.type === 'separator' || !!opt.disabled;
		option.style.color = typeColors[opt.type] || '#e8f0f8';
		option.style.fontWeight = opt.type === 'separator' ? '400' : '700';
		select.appendChild(option);
	});

	// chọn item đầu tiên không bị disabled
	const firstValid = Array.from(select.options).findIndex(o => !o.disabled);
	if (firstValid >= 0) select.selectedIndex = firstValid;
};

const updateNotify = (message) => {
	const { notify } = getElements();
	const now = new Date().toLocaleTimeString();
	notify.innerText = `[${now}] ` + message;
	log(`[${now}] ${message}`);
};


const updateUserInfo = () => {
	const elements = getElements();
	if (userInfo) {
		elements.username.innerText = userInfo.username;
		elements.from.innerText = userInfo.fromLanguage;
		elements.learn.innerText = userInfo.learningLanguage;
		elements.streak.innerHTML = '🔥 ' + Number(userInfo.streak).toLocaleString();
		elements.gem.innerHTML = '💎 ' + Number(userInfo.gems).toLocaleString();
		elements.xp.innerHTML = '⚡ ' + Number(userInfo.totalXp).toLocaleString();
		
		// Check privacy settings
		hideElement(userInfo.privacySettings && (
			userInfo.privacySettings.includes('DISABLE_FRIENDS_QUESTS') ||
			userInfo.privacySettings.includes('DISABLE_LEADERBOARDS')
		) ? elements.setAccountPrivate : elements.setAccountPublic);
		
		elements.userInfoDisplay.innerText = JSON.stringify({
			id: userInfo.id,
			username: userInfo.username,
			fromLanguage: userInfo.fromLanguage,
			learningLanguage: userInfo.learningLanguage,
			streak: userInfo.streak,
			gems: userInfo.gems,
			totalXp: userInfo.totalXp,
			creationDate: userInfo.creationDate,
			skillId: skillId,
			jwt: "hidden - use get jwt button to view",
			sub: sub,
			privacySettings: userInfo.privacySettings,
			streakData: userInfo.streakData
		}, null, 2);
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
			await apiService.farmGemOnce(userInfo);
			updateFarmResult('gem', gemFarmed);
			await delay(runtimeSettings.delayTime);
		} catch (error) {
			updateNotify(`Error ${error.status}! Please report in telegram group!`);
			await delay(runtimeSettings.retryTime);
		}
	}
};

const xpFarmingLoop = async (value, amount, config = {}) => {
	while (isRunning) {
		try {
			let response;
			if (value === 'session') {
				response = await apiService.farmSessionOnce(config);
			} else if (value === 'story') {
				response = await apiService.farmStoryOnce(config);
			}
			if (response.status > 400) {
				updateNotify(`Something went wrong! Pls try other farming methods.\nIf you are using story method, u should try with English course!`);
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
			xpFarmingLoop(value, amount, config);
			break;
		case 'streak':
			streakFarmingLoop(value);
			break;
	}
};

const loadSavedSettings = (settings) => {
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
		navigator.wakeLock.request('screen').then(wakeLock => {
			log('Screen wake lock active');
		})
	}
};


const initVariables = async () => {
	jwt = getJwtToken();
	if (!jwt) {
		disableAllControls('Please login to Duolingo and reload!');
		return;
	}
	defaultHeaders = formatHeaders(jwt);
	const decodedJwt = decodeJwtToken(jwt);
	sub = decodedJwt.sub;
	userInfo = await ApiService.getUserInfo(sub, defaultHeaders);
	
	apiService = new ApiService(jwt, defaultHeaders, userInfo, sub);
	settingsManager = new SettingsManager(shadowRoot, apiService);

	//Lấy skillId cho option 110 xp, sau đó tạo options
	skillId = extractSkillId(userInfo.currentCourse || {});
	farmOptions = [
		{ type: 'separator', label: '⟡ GEM FARMING ⟡', value: '', disabled: true },
		{ type: 'gem', label: 'Gem 30', value: 'fixed', amount: 30 },
		{ type: 'separator', label: '⟡ XP SESSION FARMING ⟡', value: '', disabled: true },
		{ type: 'separator', label: '(slow, safe, any language)', value: '', disabled: true },
		{ type: 'xp', label: 'XP 10', value: 'session', amount: 10, config: {} },
		// { type: 'xp', label: 'XP 13', value: 'session', amount: 13, config: { updateSessionPayload: { enableBonusPoints: true } } },
		{ type: 'xp', label: 'XP 20', value: 'session', amount: 20, config: { updateSessionPayload: { hasBoost: true } } },
		// { type: 'xp', label: 'XP 26', value: 'session', amount: 26, config: { updateSessionPayload: { enableBonusPoints: true, hasBoost: true } } },
		// { type: 'xp', label: 'XP 36', value: 'session', amount: 36, config: { updateSessionPayload: { enableBonusPoints: true, hasBoost: true, happyHourBonusXp: 10 } } },
		{ type: 'xp', label: 'XP 40', value: 'session', amount: 40, config: { updateSessionPayload: { hasBoost: true, type: 'TARGET_PRACTICE' } } },
		{ type: 'xp', label: 'XP 50', value: 'session', amount: 50, config: { updateSessionPayload: { enableBonusPoints: true, hasBoost: true, happyHourBonusXp: 10, type: 'TARGET_PRACTICE' } } },
		{ type: 'xp', label: 'XP 110', value: 'session', amount: 110, config: { sessionPayload: { type: 'UNIT_TEST', skillIds: skillId ? [skillId] : [] }, updateSessionPayload: { type: "UNIT_TEST", hasBoost: true, happyHourBonusXp: 10, pathLevelSpecifics: { unitIndex: 0 } } }, disabled: !skillId },
		// {
		// 	type: 'xp', label: 'TEST', value: 'session', amount: 0, config: {
		// 		sessionPayload: { type: 'UNIT_TEST', skillIds: skillId ? [skillId] : [] },
		// 		updateSessionPayload: {
		// 			hasBoost: true,
		// 			happyHourBonusXp: 10,
		// 			pathLevelSpecifics: {
		// 				unitIndex: 0,
		// 			}
		// 		}
		// 	},
		// 	disabled: !skillId
		// },
		{ type: 'separator', label: '⟡ XP STORY FARMING ⟡', value: '', disabled: true },
		{ type: 'separator', label: '(fast, unsafe, English only) ', value: '', disabled: true },
		{ type: 'xp', label: 'XP 50', value: 'story', amount: 50, config: {} },
		// { type: 'xp', label: 'XP 90 ', value: 'story', amount: 90, config: { storyPayload: { hasXpBoost: true } } },
		{ type: 'xp', label: 'XP 100 ', value: 'story', amount: 100, config: { storyPayload: { happyHourBonusXp: 50 } } },
		{ type: 'xp', label: 'XP 200 ', value: 'story', amount: 200, config: { storyPayload: { happyHourBonusXp: 150 } } },
		{ type: 'xp', label: 'XP 300 ', value: 'story', amount: 300, config: { storyPayload: { happyHourBonusXp: 250 } } },
		{ type: 'xp', label: 'XP 400 ', value: 'story', amount: 400, config: { storyPayload: { happyHourBonusXp: 350 } } },
		{ type: 'xp', label: 'XP 499 ', value: 'story', amount: 499, config: { storyPayload: { happyHourBonusXp: 449 } } },
		{ type: 'separator', label: '⟡ STREAK FARMING ⟡', value: '', disabled: true },
		{ type: 'streak', label: 'Nonstop farm (unlimited)', value: 'farm' },
		{ type: 'streak', label: 'Repair streak (from account creation)', value: 'repair' },
	];
};

const initSettings = () => {
	// Load option lên setting menu và ghi đè defaultOption lên main
	settingsManager.populateDefaultOptionSelect(farmOptions);
	settingsManager.loadDefaultFarmingOption(farmOptions);
	settingsManager.loadSettingsToUI();
}


(async () => {
	try {
		initInterface(); //khởi tạo giao diện
		setInterfaceVisible(false); //ẩn giao diện
		addEventFloatingBtn(); //thêm sự kiện cho floating button
		await initVariables(); //khởi tạo biến, class
		populateOptions(); //gắn options lên giao diện
		initSettings(); //cấu hình setting
		updateUserInfo(); //cập nhật thông tin user
		addEventListeners(); // thêm các sự kiện còn lại
		loadSavedSettings(settingsManager.getSettings()); //tải setting đã lưu
		updateNotify('Duofarmer ready! For safety, I suggest that you use 2nd accounts.\nLimited or no use of "Story Farming"!');
	} catch (err) {
		logError(err, 'Duofarmer init error!');
	}
})();
