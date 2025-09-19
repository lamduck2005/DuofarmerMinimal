import templateRaw from './main.html?raw';
import cssText from './main.css?inline';
import { ApiService } from './service/api.js';
import { delay, toTimestamp, getCurrentUnixTimestamp, getJwtToken, decodeJwtToken, formatHeaders, logError, log } from './utils/utils.js';

const DELAY = 500;
const ERROR_DELAY = 1000;
let jwt, defaultHeaders, userInfo, sub, apiService;
let isRunning = false;
let shadowRoot = null;

const OPTIONS = [
	{ type: 'gem', label: 'Gem 30', value: 'fixed', amount: 30 },
	{ type: 'xp', label: 'XP 10 (session) (safe)', value: 'session', amount: 10 },
	{ type: 'xp', label: 'XP 499 (story) (Learning English only)', value: 'story', amount: 499 },
	{ type: 'streak', label: 'Streak farm (test)', value: 'farm' },
];

const getElements = () => ({
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
});

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

const setInterfaceVisible = (visible) => {
	const { container, overlay } = getElements();
	container.style.display = visible ? 'flex' : 'none';
	overlay.style.display = visible ? 'block' : 'none';
};

const isInterfaceVisible = () => {
	const { container } = getElements();
	return container.style.display !== 'none' && container.style.display !== '';
};

const toggleInterface = () => {
	setInterfaceVisible(!isInterfaceVisible());
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

const addEventListeners = () => {
	addEventFloatingBtn();
	addEventStartBtn();
	addEventStopBtn();
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

const xpFarmingLoop = async (value, amount) => {
	while (isRunning) {
		try {
			let response;
			if (value === 'session') {
				response = await apiService.farmSessionOnce();
			} else if (value === 'story') {
				response = await apiService.farmStoryOnce(amount);
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
			const sessionRes = await apiService.farmSessionOnce(currentTimestamp, currentTimestamp + 60);
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
	const { type, value, amount } = option;
	switch (type) {
		case 'gem':
			gemFarmingLoop();
			break;
		case 'xp':
			xpFarmingLoop(value, amount);
			break;
		case 'streak':
			streakFarmingLoop();
			break;
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
};

(async () => {
	try {
		initInterface();
		setInterfaceVisible(false);
		addEventListeners();
		await initVariables();
		updateUserInfo();
	} catch (err) {
		logError(err, 'init main.js');
	}
})();