import templateRaw from './main.html?raw';
import cssText from './main.css?inline';
import { getUserInfo, createApi } from './api.js';
import { delay, toTimestamp, getJwtToken, decodeJwtToken, daysBetween, getCurrentUnixTimestamp, getTodayDateStr } from './utils.js';
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

const LANG_TO_COUNTRY = {
	'en': 'us', 'vi': 'vn', 'ja': 'jp', 'ko': 'kr', 'zh': 'cn', 'zs': 'cn',
	'ar': 'sa', 'he': 'il', 'hi': 'in', 'bn': 'bd', 'ta': 'in', 'te': 'in',
	'da': 'dk', 'nb': 'no', 'sv': 'se', 'el': 'gr', 'cs': 'cz', 'uk': 'ua',
	'cy': 'gb', 'ga': 'ie', 'ca': 'es', 'sw': 'ke', 'tl': 'ph',
	'haw': 'us', 'nah': 'mx', 'nv': 'us', 'zu': 'za', 'yi': 'il',
	'eo': null, 'la': null, 'tlh': null, 'hv': null,
};

let isRunning = false;

let shadowRoot = null;

let apiService = null;
let settings = null;

let farmOptions = [];

let autoStopTimerId = null;
let farmAbortController = null;

const abortableDelay = (ms) => {
	const signal = farmAbortController?.signal;
	if (!signal) return delay(ms);
	return new Promise((resolve, reject) => {
		if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
		const id = setTimeout(resolve, ms);
		signal.addEventListener('abort', () => {
			clearTimeout(id);
			reject(new DOMException('Aborted', 'AbortError'));
		}, { once: true });
	});
};

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
	delayTime: shadowRoot.getElementById('delay-time'),
	retryTime: shadowRoot.getElementById('retry-time'),
	farmAnimation: shadowRoot.getElementById('farm-animation'),
	autoKeepStreak: shadowRoot.getElementById('auto-keep-streak'),
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
	if (el.delayTime) el.delayTime.value = settings.delayTime;
	if (el.retryTime) el.retryTime.value = settings.retryTime;
	if (el.farmAnimation) el.farmAnimation.checked = settings.farmAnimation;
	if (el.autoKeepStreak) el.autoKeepStreak.checked = settings.autoKeepStreak;
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
		delayTime: parseInt(el.delayTime?.value) || 500,
		retryTime: parseInt(el.retryTime?.value) || 1000,
		farmAnimation: el.farmAnimation?.checked || false,
		autoKeepStreak: el.autoKeepStreak?.checked || false,
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
	const defaultOpt = farmOptions[settings.defaultOption];
	const type = (defaultOpt && defaultOpt.type !== 'separator') ? defaultOpt.type : 'xp';
	filterSelectByType(type);
	const select = shadowRoot.getElementById('select-option');
	const target = select.querySelector(`option[data-index="${settings.defaultOption}"]`);
	if (target) target.selected = true;
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
		showToast('Settings saved! Reload to apply changes.', 'success', 5000);
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
			showToast('Settings reset! Reload to apply changes.', 'success', 5000);
		}
	});
};

const setRunningState = (running) => {
	isRunning = running;
	if (running) {
		farmAbortController = new AbortController();
	} else {
		farmAbortController?.abort();
		if (autoStopTimerId) {
			clearTimeout(autoStopTimerId);
			autoStopTimerId = null;
		}
	}
	const { startBtn, stopBtn, select, container } = getElements();
	container.classList.toggle('running', running);
	if (running) {
		startBtn.hidden = true;
		stopBtn.hidden = false;
		select.disabled = true;
	} else {
		stopBtn.hidden = true;
		startBtn.hidden = false;
		select.disabled = false;
	}
};


const setLoadingOverlay = (visible, message = 'DuoFarmer is loading...', isError = false) => {
	const overlay = shadowRoot?.getElementById('loading-overlay');
	if (!overlay) return;
	const text = overlay.querySelector('.loading-text');
	const duopixel = overlay.querySelector('.loading-duopixel');
	const ringBefore = overlay.querySelector('.loading-ring');
	if (text) {
		text.textContent = message;
		text.style.color = isError ? '#f87171' : '';
	}
	if (duopixel) duopixel.style.background = isError ? '#dc2626' : '';
	if (ringBefore) ringBefore.style.setProperty('--ring-color', isError ? '#dc2626' : '#10b981');
	if (visible) {
		overlay.classList.remove('hidden');
	} else {
		overlay.classList.add('hidden');
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
		'container',
	];

	for (const id of requiredElements) {
		if (!shadowRoot.getElementById(id)) {
			throw new Error(`Required UI element '${id}' not found in template. Template may be corrupted.`);
		}
	}
};

const showElement = (element) => {
	if (!element) return;
	element.style.display = 'flex';
	element.classList.remove('anim-out');
	void element.offsetWidth;
	element.classList.add('anim-in');
};

const hideElement = (element) => {
	if (!element) return;
	element.classList.remove('anim-in');
	void element.offsetWidth;
	element.classList.add('anim-out');
	element.addEventListener('animationend', () => {
		element.style.display = 'none';
		element.classList.remove('anim-out');
	}, { once: true });
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
	const { container } = getElements();
	if (visible) {
		showElement(container);
	} else {
		hideElement(container);
	}
};

const addEventFloatingBtn = () => {
	const { floatingBtn } = getElements();
	floatingBtn.addEventListener('click', () => {
		toggleInterface();
	});
};

const addEventStartBtn = () => {
	const { startBtn, select } = getElements();
	startBtn.addEventListener('click', async () => {
		setRunningState(true);
		showToast('Farming started.', 'success');

		if (runtimeSettings.autoStopTime > 0) {
			showToast(`Auto-stop in ${runtimeSettings.autoStopTime} minute(s).`);
			autoStopTimerId = setTimeout(() => {
				showToast(`Auto-stopped after ${runtimeSettings.autoStopTime} minute(s).`, 'info', 0);
				GM_log(`Auto-stopped after ${runtimeSettings.autoStopTime} minutes.`);
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
		showToast('Farming stopped.');
	});
};

const isInterfaceVisible = () => {
	const { container } = getElements();
	return container.style.display !== 'none' && container.style.display !== '';
};

const toggleInterface = () => {
	setInterfaceVisible(!isInterfaceVisible());
};

const addEventStatCards = () => {
	const typeMap = { 'streak-card': 'streak', 'xp-card': 'xp', 'gem-card': 'gem' };
	shadowRoot.querySelectorAll('.stat-card').forEach(card => {
		card.addEventListener('click', () => {
			if (isRunning) return;
			const type = Object.keys(typeMap).find(cls => card.classList.contains(cls));
			if (type) filterSelectByType(typeMap[type]);
		});
	});
};

const showToast = (msg, type = 'info', duration = 3000) => {
	GM_log(msg);
	const toast = shadowRoot.getElementById('toast');
	const toastMsg = shadowRoot.getElementById('toast-msg');
	const permanent = duration === 0;
	toast.className = '';
	void toast.offsetWidth;
	toast.style.setProperty('--duration', `${duration}ms`);
	toast.className = `show ${type}${permanent ? ' permanent' : ''}`;
	toastMsg.textContent = msg;
};

const addEventToast = () => {
	const toast = shadowRoot.getElementById('toast');
	toast.addEventListener('animationend', (e) => {
		if (e.animationName === 'toast-life') toast.className = '';
	});
	shadowRoot.getElementById('toast-close').addEventListener('click', () => {
		toast.classList.add('hiding');
		toast.addEventListener('animationend', () => { toast.className = ''; }, { once: true });
	});
};

const addEventListeners = () => {
	addEventStartBtn();
	addEventStopBtn();
	addEventStatCards();
	addEventToast();
	const { container } = getElements();
	addEventSettings(container);
	addSettingsEventListeners();
};

const populateOptions = () => {
	const select = shadowRoot.getElementById('select-option');
	select.innerHTML = '';
	farmOptions.forEach((opt, index) => {
		if (opt.type === 'separator') return;
		const option = document.createElement('option');
		option.value = opt.value;
		option.textContent = opt.label;
		option.setAttribute('data-type', opt.type);
		option.setAttribute('data-index', index);
		if (opt.amount != null) option.setAttribute('data-amount', String(opt.amount));
		if (opt.config) option.setAttribute('data-config', JSON.stringify(opt.config));
		if (opt.disabled) option.disabled = true;
		option.hidden = true;
		select.appendChild(option);
	});
};

const filterSelectByType = (type) => {
	const select = shadowRoot.getElementById('select-option');
	const typeToClass = { streak: 'streak-card', xp: 'xp-card', gem: 'gem-card' };

	shadowRoot.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active'));
	const targetCard = shadowRoot.querySelector(`.${typeToClass[type]}`);
	if (targetCard) targetCard.classList.add('active');

	select.querySelectorAll('option[data-type]').forEach(opt => {
		opt.hidden = opt.dataset.type !== type;
	});

	const first = Array.from(select.options).find(o => o.dataset.type === type && !o.disabled);
	if (first) first.selected = true;
};



const animateNumber = (element, toValue, duration = 700) => {
	cancelAnimationFrame(element._animFrame);

	const fromValue = parseFloat(element.textContent.replace(/,/g, '')) || 0;
	if (fromValue === toValue) return;

	if (!settings?.farmAnimation) {
		element.textContent = toValue.toLocaleString();
		return;
	}

	const tilt = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 6);
	element.style.setProperty('--tilt', `${tilt.toFixed(1)}deg`);
	element.style.setProperty('--anim-dur', `${duration}ms`);
	element.classList.remove('counting');
	void element.offsetWidth;
	element.classList.add('counting');

	const startTime = performance.now();
	const diff = toValue - fromValue;

	const tick = (now) => {
		const progress = Math.min((now - startTime) / duration, 1);
		const eased = 1 - Math.pow(2, -10 * progress);
		element.textContent = Math.round(fromValue + diff * eased).toLocaleString();
		element._animFrame = progress < 1
			? requestAnimationFrame(tick)
			: void (element.textContent = toValue.toLocaleString(), element.classList.remove('counting'));
	};

	element._animFrame = requestAnimationFrame(tick);
};

const updateUserInfo = () => {
	const elements = getElements();
	if (userInfo) {
		elements.username.innerText = userInfo.username;
		animateNumber(elements.streak, userInfo.streak);
		animateNumber(elements.gem, userInfo.gems);
		animateNumber(elements.xp, userInfo.totalXp);

		const lang = userInfo.fromLanguage?.toLowerCase();
		const country = lang in LANG_TO_COUNTRY ? LANG_TO_COUNTRY[lang] : lang;
		const flagEl = shadowRoot.getElementById('avatar-flag');
		if (flagEl && country) flagEl.src = `https://flagcdn.com/${country}.svg`;

		const avatarEl = shadowRoot.getElementById('avatar-img');
		if (avatarEl && userInfo.picture) {
			avatarEl.src = userInfo.picture;
			avatarEl.style.display = '';
		}
	}
};

const updateFarmResult = (type, farmedAmount) => {
	switch (type) {
		case 'gem':
			userInfo = { ...userInfo, gems: userInfo.gems + farmedAmount };
			break;
		case 'xp':
			userInfo = { ...userInfo, totalXp: userInfo.totalXp + farmedAmount };
			break;
		case 'streak':
			userInfo = { ...userInfo, streak: userInfo.streak + farmedAmount };
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
			await abortableDelay(runtimeSettings.delayTime);
		} catch (error) {
			if (error.name === 'AbortError') return;
			GM_log(`[gem] ${error?.status || error?.message || error}`);
			try { await abortableDelay(runtimeSettings.retryTime); } catch { return; }
		}
	}
};

const xpFarmingLoop = async (config = {}) => {
	while (isRunning) {
		try {
			const response = await apiService.farmSessionOnce(config);
			if (response.status >= 400) {
				GM_log(`[xp] HTTP ${response.status}, retrying...`);
				await abortableDelay(runtimeSettings.retryTime);
				continue;
			}
			const responseData = await response.json();
			const xpFarmed = responseData?.awardedXp || responseData?.xpGain || 0;
			updateFarmResult('xp', xpFarmed);
			await abortableDelay(runtimeSettings.delayTime);
		} catch (error) {
			if (error.name === 'AbortError') return;
			GM_log(`[xp] ${error?.status || error?.message || error}`);
			try { await abortableDelay(runtimeSettings.retryTime); } catch { return; }
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

	const lastExtendedDate = userInfo.streakData.currentStreak?.lastExtendedDate;
	const today = getTodayDateStr();
	if (lastExtendedDate === today) {
		currentTimestamp -= SECONDS_PER_DAY;
	}

	if (value === 'repair') {
		const creationDate = userInfo.creationDate;
		const currentStreak = userInfo.streak || 0;
		const currentTime = getCurrentUnixTimestamp();
		const daysSinceCreation = daysBetween(creationDate, currentTime);
		const maxPossibleStreak = daysSinceCreation + 1;

		if (currentStreak >= maxPossibleStreak) {
			showToast(`No repair needed. Current: ${currentStreak}, max possible: ${maxPossibleStreak}.`, 'info');
			setRunningState(false);
			return;
		}

		const endTimestamp = creationDate;
		const missingStreaks = maxPossibleStreak - currentStreak;

		if (missingStreaks <= 0) {
			GM_log('[streak] No missing streaks to repair.');
			setRunningState(false);
			return;
		}

		GM_log(`[streak] Repairing ${missingStreaks} missing streaks...`);

		let repairTimestamp = currentTimestamp;
		let repairedCount = 0;

		while (isRunning && repairTimestamp >= endTimestamp && repairedCount < missingStreaks) {
			try {
				const sessionRes = await apiService.farmSessionOnce({ startTime: repairTimestamp, endTime: repairTimestamp + SESSION_DURATION_SECONDS });
				if (sessionRes.status < 400) {
					repairTimestamp -= SECONDS_PER_DAY;
					updateFarmResult('streak', 1);
					repairedCount += 1;
					await abortableDelay(runtimeSettings.delayTime);
				} else {
					GM_log(`[streak] repair HTTP ${sessionRes.status}, retrying...`);
					await abortableDelay(runtimeSettings.retryTime);
				}
			} catch (error) {
				if (error.name === 'AbortError') return;
				GM_log(`[streak] repair error: ${error?.message || error}`);
				try { await abortableDelay(runtimeSettings.retryTime); } catch { return; }
			}
		}

		if (repairedCount >= missingStreaks || repairTimestamp < endTimestamp) {
			showToast(`Repair complete: ${repairedCount} day(s) repaired.`, 'success', 30000);
			setRunningState(false);
		}
	} else {
		while (isRunning) {
			try {
				const sessionRes = await apiService.farmSessionOnce({ startTime: currentTimestamp, endTime: currentTimestamp + SESSION_DURATION_SECONDS });
				if (sessionRes.status < 400) {
					currentTimestamp -= SECONDS_PER_DAY;
					updateFarmResult('streak', 1);
					await abortableDelay(runtimeSettings.delayTime);
				} else {
					GM_log(`[streak] farm HTTP ${sessionRes.status}, retrying...`);
					await abortableDelay(runtimeSettings.retryTime);
				}
			} catch (error) {
				if (error.name === 'AbortError') return;
				GM_log(`[streak] farm error: ${error?.message || error}`);
				try { await abortableDelay(runtimeSettings.retryTime); } catch { return; }
			}
		}
	}
};

const keepStreak = async () => {
	const lastExtended = userInfo.streakData?.currentStreak?.lastExtendedDate;
	if (lastExtended === getTodayDateStr()) {
		showToast('Streak already done today.', 'info');
		return;
	}
	showToast('Auto keeping streak...');
	try {
		const streakBefore = userInfo.streak;
		const headers = formatHeaders(jwt);
		await apiService.farmSessionOnce({});
		const freshInfo = await getUserInfo(sub, headers);
		userInfo = { ...userInfo, ...freshInfo };
		updateUserInfo();
		if (userInfo.streak > streakBefore) {
			showToast('Streak kept successfully!', 'success',0);
		} else {
			showToast('Streak already done today.', 'info');
		}
	} catch (err) {
		GM_log(`[autoKeepStreak] error: ${err?.message || err}`);
		showToast('Auto keep streak failed.', 'error');
	}
};

const farmSelectedOption = async (option) => {
	const { type, value, config } = option;
	switch (type) {
		case 'gem':
			await gemFarmingLoop();
			break;
		case 'xp':
			await xpFarmingLoop(config);
			break;
		case 'streak':
			await streakFarmingLoop(value);
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
			GM_log('Screen wake lock active');
		});
	}
	if (settings.autoKeepStreak) {
		keepStreak();
	}
};

const waitForJwt = () => new Promise((resolve) => {
	const attempt = () => {
		const token = getJwtToken();
		if (token) return resolve(token);
		setLoadingOverlay(true, 'Waiting for login...', true);
		setTimeout(attempt, 2000);
	};
	attempt();
});

const initVariables = async () => {
	jwt = getJwtToken();
	if (!jwt) {
		jwt = await waitForJwt();
		setLoadingOverlay(true, 'DuoFarmer is loading...');
	}
	const headers = formatHeaders(jwt);
	const decodedJwt = decodeJwtToken(jwt);
	sub = decodedJwt.sub;
	userInfo = await getUserInfo(sub, headers);

	apiService = createApi(jwt, userInfo, () => farmAbortController?.signal);

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


const applyAutoOpenMenu = () => {
	setInterfaceVisible(loadSettings()?.autoOpenUI ?? false);
};

(async () => {
	try {
		initInterface();
		addEventFloatingBtn();
		applyAutoOpenMenu();

		await initVariables();

		populateOptions();
		initSettings();
		updateUserInfo();
		addEventListeners();
		loadSavedSettings();
		setLoadingOverlay(false);
		GM_log('[DuoFarmer] ready');
	} catch (err) {
		GM_log(`Duofarmer init error: ${err?.message || err}`);
		setLoadingOverlay(true, `Error: ${err?.message || 'Something went wrong. Reload to retry.'}`, true);
	}
})();
