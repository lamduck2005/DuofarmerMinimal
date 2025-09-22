import templateRaw from './main.html?raw';
import cssText from './main.css?inline';
import { ApiService } from './service/api.js';
import { delay, toTimestamp, getCurrentUnixTimestamp, getJwtToken, decodeJwtToken, formatHeaders, logError, log } from './utils/utils.js';
import { SettingsManager } from './settings/settings-manager.js';

const DELAY = 500;
const ERROR_DELAY = 1000;
let jwt, defaultHeaders, userInfo, sub, apiService;
let isRunning = false;
let shadowRoot = null;
let settingsManager = null;

// const BONUS_XP_CONFIG = {
//   "enableBonusPoints": true, //3xp
//   "hasBoost": true, //x2 xp session
//   hasXpBoost: true, //x2 xp story
//   happyHourBonusXp: 449 // +449 xp story
// }


const OPTIONS = [
	{ type: 'separator', label: '⟡ GEM FARMING ⟡', value: '', disabled: true },
	{ type: 'gem', label: 'Gem 30', value: 'fixed', amount: 30 },
	{ type: 'separator', label: '⟡ XP SESSION FARMING ⟡', value: '', disabled: true },
	{ type: 'separator', label: '(slow but safe)', value: '', disabled: true },
	{ type: 'xp', label: 'XP 10', value: 'session', amount: 10, config: {} },
	{ type: 'xp', label: 'XP 13', value: 'session', amount: 13, config: { enableBonusPoints: true } },
	{ type: 'xp', label: 'XP 20', value: 'session', amount: 20, config: { hasBoost: true } },
	{ type: 'xp', label: 'XP 26', value: 'session', amount: 26, config: { enableBonusPoints: true, hasBoost: true } },
	{ type: 'xp', label: 'XP 36', value: 'session', amount: 36, config: { enableBonusPoints: true, hasBoost: true, happyHourBonusXp: 10 } },
	{ type: 'separator', label: '⟡ XP STORY FARMING ⟡', value: '', disabled: true },
	{ type: 'separator', label: '(fast, unsafe, English only) ', value: '', disabled: true },
	{ type: 'xp', label: 'XP 50', value: 'story', amount: 0, config: {} },
	{ type: 'xp', label: 'XP 90 ', value: 'story', amount: 0, config: { hasXpBoost: true } },
	{ type: 'xp', label: 'XP 100 ', value: 'story', amount: 100, config: { happyHourBonusXp: 50 } },
	{ type: 'xp', label: 'XP 200 ', value: 'story', amount: 200, config: { happyHourBonusXp: 150 } },
	{ type: 'xp', label: 'XP 300 ', value: 'story', amount: 300, config: { happyHourBonusXp: 250 } },
	{ type: 'xp', label: 'XP 400 ', value: 'story', amount: 400, config: { happyHourBonusXp: 350 } },
	{ type: 'xp', label: 'XP 499 ', value: 'story', amount: 499, config: { happyHourBonusXp: 449 } },
	{ type: 'separator', label: '⟡ STREAK FARMING ⟡', value: '', disabled: true },
	{ type: 'streak', label: 'Streak farm (test)', value: 'farm' },
];

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
	};
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
	addEventFloatingBtn();
	addEventStartBtn();
	addEventStopBtn();

	const { container } = getElements();
	settingsManager.addEventSettings(container);
	settingsManager.addEventListeners();
};

const populateOptions = () => {
	const select = shadowRoot.getElementById('select-option');
	select.innerHTML = '';
	OPTIONS.forEach((opt) => {
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
	const { notify } = getElements();
	const now = new Date().toLocaleTimeString();
	notify.innerText = `[${now}] ` + message;
	log(`[${now}] ${message}`);
};


const updateUserInfo = () => {
	const { username, from, learn, streak, gem, xp } = getElements();
	if (userInfo) {
		username.innerText = userInfo.username;
		from.innerText = userInfo.fromLanguage;
		learn.innerText = userInfo.learningLanguage;
		streak.innerText = userInfo.streak;
		gem.innerText = userInfo.gems;
		xp.innerText = userInfo.totalXp;
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
			await delay(DELAY);
		} catch (error) {
			updateNotify(`Error ${error.status}! Please record screen and report in telegram group!`);
			await delay(ERROR_DELAY);
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
				updateNotify(`Something went wrong! Pls try other farming methods.\nIf you are using story method, make sure you are on English course (learning language == en)!`);
				await delay(ERROR_DELAY);
				continue;
			}
			const responseData = await response.json();
			const xpFarmed = responseData?.awardedXp || responseData?.xpGain || 0;
			updateFarmResult('xp', xpFarmed);
			await delay(DELAY);
		} catch (error) {
			updateNotify(`Error ${error.status}! Please record screen and report in telegram group!`);
			await delay(ERROR_DELAY);
		}
	}
};

const streakFarmingLoop = async () => {
	const hasStreak = !!userInfo.streakData.currentStreak;
	const startStreakDate = hasStreak ? userInfo.streakData.currentStreak.startDate : new Date();
	const startFarmStreakTimestamp = toTimestamp(startStreakDate);
	let currentTimestamp = hasStreak ? startFarmStreakTimestamp - 86400 : startFarmStreakTimestamp;
	while (isRunning) {
		try {
			const sessionRes = await apiService.farmSessionOnce({ startTime: currentTimestamp, endTime: currentTimestamp + 60 });
			if (sessionRes) {
				currentTimestamp -= 86400;
				updateFarmResult('streak', 1);
				await delay(DELAY);
			} else {
				updateNotify("Failed to farm streak session, I'm trying again...");
				await delay(ERROR_DELAY);
				continue;
			}
		} catch (error) {
			updateNotify(`Error in farmStreak: ${error?.message || error}`);
			await delay(ERROR_DELAY);
			continue;
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
			streakFarmingLoop();
			break;
	}
};

const loadSavedSettings = (settings) => {
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
		}).catch(err => {
			logError('Wake lock failed:', err);
		});
	}
	if (settings.delayTime) {
		//todo
	}
	if (settings.retryTime) {
		//todo
	}
	if (settings.autoStopTime) {
		//todo
	}
	if (settings.darkMode) {
		//todo
	}
	if (settings.compactUI) {
		//todo
	}
	if (settings.showProgress) {
		//todo
	}
	if (settings.fontSize) {
		//todo
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
	populateOptions();

	settingsManager = new SettingsManager(shadowRoot);
	const settings = settingsManager.getSettings();

	// Load option lên setting menu và ghi đè defaultOption lên main
	settingsManager.populateDefaultOptionSelect(OPTIONS);
	settingsManager.loadDefaultFarmingOption(OPTIONS);
	settingsManager.loadSettingsToUI();
};


(async () => {
	try {
		initInterface();
		setInterfaceVisible(false);
		await initVariables();
		updateUserInfo();
		addEventListeners();
		loadSavedSettings(settingsManager.getSettings());
	} catch (err) {
		logError(err, 'init main.js');
	}
})();