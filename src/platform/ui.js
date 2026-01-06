import { log } from '../utils/utils.js';

// Helper functions
export function getElements(shadowRoot) {
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
}

export function showElement(element) {
	if (element) element.style.display = 'flex';
}

export function hideElement(element) {
	if (element) element.style.display = 'none';
}

export function toggleModal(modalElement, mainElement) {
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
}

export class UIController {
	constructor(templateRaw, cssText) {
		this.templateRaw = templateRaw;
		this.cssText = cssText;
		this.shadowRoot = null;
		this.container = null;
	}

	init() {
		this.container = document.createElement('div');
		this.shadowRoot = this.container.attachShadow({ mode: 'open' });

		const style = document.createElement('style');
		style.textContent = this.cssText;
		this.shadowRoot.appendChild(style);

		const content = document.createElement('div');
		content.innerHTML = this.templateRaw;
		this.shadowRoot.appendChild(content);

		document.body.appendChild(this.container);

		// Hide settings container initially
		const settingsContainer = this.shadowRoot.getElementById('settings-container');
		if (settingsContainer) {
			settingsContainer.style.display = 'none';
		}

		// Validate required elements exist
		const requiredElements = [
			'start-btn', 'stop-btn', 'select-option', 'floating-btn',
			'container', 'overlay', 'notify'
		];

		for (const id of requiredElements) {
			if (!this.shadowRoot.getElementById(id)) {
				throw new Error(`Required UI element '${id}' not found in template. Template may be corrupted.`);
			}
		}

		return this.shadowRoot;
	}

	getShadowRoot() {
		return this.shadowRoot;
	}

	setVisible(visible) {
		const elements = getElements(this.shadowRoot);
		if (visible) {
			showElement(elements.container);
			showElement(elements.overlay);
		} else {
			hideElement(elements.container);
			hideElement(elements.overlay);
		}
	}

	isVisible() {
		const elements = getElements(this.shadowRoot);
		return elements.container.style.display !== 'none' && elements.container.style.display !== '';
	}

	toggle() {
		this.setVisible(!this.isVisible());
	}
}

export class UIState {
	constructor(shadowRoot) {
		this.shadowRoot = shadowRoot;
		this.isRunning = false;
		this.autoStopTimerId = null;
	}

	setRunning(running) {
		this.isRunning = running;
		const elements = getElements(this.shadowRoot);
		
		if (running) {
			elements.startBtn.hidden = true;
			elements.stopBtn.hidden = false;
			elements.stopBtn.disabled = true;
			elements.stopBtn.className = 'disable-btn';
			elements.select.disabled = true;
		} else {
			elements.stopBtn.hidden = true;
			elements.startBtn.hidden = false;
			elements.startBtn.disabled = true;
			elements.startBtn.className = 'disable-btn';
			elements.select.disabled = false;
			
			if (this.autoStopTimerId) {
				clearTimeout(this.autoStopTimerId);
				this.autoStopTimerId = null;
			}
		}

		setTimeout(() => {
			const elements = getElements(this.shadowRoot);
			elements.startBtn.className = '';
			elements.startBtn.disabled = false;
			elements.stopBtn.className = '';
			elements.stopBtn.disabled = false;
		}, 3000);
	}

	getIsRunning() {
		return this.isRunning;
	}

	disableAllControls() {
		const elements = getElements(this.shadowRoot);
		elements.startBtn.disabled = true;
		elements.startBtn.className = 'disable-btn';
		elements.stopBtn.disabled = true;
		elements.select.disabled = true;
	}
}

// Helper functions
const updatePrivacyButtons = (elements, isPrivate) => {
	elements.setAccountPublic.style.display = isPrivate ? 'none' : 'flex';
	elements.setAccountPrivate.style.display = isPrivate ? 'flex' : 'none';
};

const extractOptionData = (selected) => ({
	type: selected.getAttribute('data-type'),
	amount: Number(selected.getAttribute('data-amount')),
	value: selected.value,
	label: selected.textContent,
	config: selected.getAttribute('data-config') ? JSON.parse(selected.getAttribute('data-config')) : {},
});

export class UIHandlers {
	constructor(shadowRoot, farmingController, userManager, settingsManager, uiController, uiState) {
		this.shadowRoot = shadowRoot;
		this.farmingController = farmingController;
		this.userManager = userManager;
		this.settingsManager = settingsManager;
		this.uiController = uiController;
		this.uiState = uiState;
	}

	setupEventListeners() {
		this.addEventStartBtn();
		this.addEventStopBtn();
		this.addEventFloatingBtn();
		this.addEventSettings();
		this.settingsManager.addEventListeners();
	}

	addEventStartBtn() {
		const elements = getElements(this.shadowRoot);
		elements.startBtn.addEventListener('click', async () => {
			this.uiState.setRunning(true);

			const selected = elements.select.options[elements.select.selectedIndex];
			const optionData = extractOptionData(selected);

			const userInfo = this.userManager.getUserInfo();
			this.farmingController.start(optionData, userInfo).catch((error) => {
				this.updateNotify(`Farming error: ${error?.message || error}`);
				this.uiState.setRunning(false);
			});
		});
	}

	addEventStopBtn() {
		const elements = getElements(this.shadowRoot);
		elements.stopBtn.addEventListener('click', () => {
			this.farmingController.stop();
			this.uiState.setRunning(false);
		});
	}

	addEventFloatingBtn() {
		const elements = getElements(this.shadowRoot);
		elements.floatingBtn.addEventListener('click', () => {
			if (this.uiState.getIsRunning()) {
				if (confirm('Duofarmer is farming. Do you want to stop and hide UI?')) {
					this.farmingController.stop();
					this.uiState.setRunning(false);
					this.uiController.setVisible(false);
				}
				return;
			}
			this.uiController.toggle();
		});
	}

	addEventSettings() {
		const elements = getElements(this.shadowRoot);
		const settingsModal = toggleModal(elements.settingsContainer, elements.container);
		
		elements.settingsBtn.addEventListener('click', settingsModal.show);
		elements.settingsClose.addEventListener('click', settingsModal.hide);
	}

	updateNotify(message) {
		const elements = getElements(this.shadowRoot);
		const now = new Date().toLocaleTimeString();
		elements.notify.innerText = `[${now}] ` + message;
		log(`[${now}] ${message}`);
	}

	updateUserInfo(userInfo, skillId, sub) {
		if (!userInfo) return;

		const elements = getElements(this.shadowRoot);
		elements.username.innerText = userInfo.username;
		elements.from.innerText = userInfo.fromLanguage;
		elements.learn.innerText = userInfo.learningLanguage;
		elements.streak.innerText = userInfo.streak;
		elements.gem.innerText = userInfo.gems;
		elements.xp.innerText = userInfo.totalXp;

		// Check privacy settings
		const isPrivate = userInfo.privacySettings?.some(
			setting => ['DISABLE_FRIENDS_QUESTS', 'DISABLE_LEADERBOARDS'].includes(setting)
		);
		updatePrivacyButtons(elements, isPrivate);

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

	populateOptions(farmOptions) {
		const select = this.shadowRoot.getElementById('select-option');
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
	}

	loadSavedSettings(settings) {
		const elements = getElements(this.shadowRoot);
		
		if (settings.autoOpenUI) {
			this.uiController.setVisible(true);
		}
		if (settings.autoStart) {
			this.uiController.setVisible(true);
			elements.startBtn.click();
		}
		if (settings.hideUsername) {
			elements.username.classList.add('blur');
		}
		if (settings.keepScreenOn && 'wakeLock' in navigator) {
			navigator.wakeLock.request('screen').then(wakeLock => {
				log('Screen wake lock active');
			});
		}
	}
}

