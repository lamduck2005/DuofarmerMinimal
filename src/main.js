import { initPatcher } from './service/patcher.js';
import templateRaw from './main.html?raw';
import cssText from './main.css?inline';
import { ApiService } from './service/api.js';
import { delay, getJwtToken, decodeJwtToken, formatHeaders, logError, log, extractSkillId } from './utils/utils.js';
import { SettingsManager } from './settings/settings-manager.js';
import { FarmingController } from './core/farming.js';
import { UserManager } from './core/user.js';
import { generateFarmOptions } from './core/config.js';
import { UIController, UIState, UIHandlers } from './platform/ui.js';

// Initialize patcher immediately to intercept fetch before Duolingo loads
initPatcher();

// Helper function to setup callbacks
function setupCallbacks(userManager, farmingController, uiHandlers, skillId, sub) {
	userManager.callbacks.onUserInfoUpdate = (userInfo) => {
		uiHandlers.updateUserInfo(userInfo, skillId, sub);
	};

	userManager.callbacks.onNotify = (message) => {
		uiHandlers.updateNotify(message);
	};

	farmingController.callbacks.onError = (message) => {
		uiHandlers.updateNotify(message);
	};

	farmingController.callbacks.onNotify = (message) => {
		uiHandlers.updateNotify(message);
	};
}

(async () => {
	try {
		// Initialize UI
		const uiController = new UIController(templateRaw, cssText);
		const shadowRoot = uiController.init();
		uiController.setVisible(false);

		// Initialize UI state
		const uiState = new UIState(shadowRoot);

		// Initialize user manager
		const userManager = new UserManager({
			onUserInfoUpdate: (userInfo) => {
				// Will be set up after handlers are created
			}
		});

		// Get JWT and user info
		const jwt = getJwtToken();
		if (!jwt) {
			uiState.disableAllControls();
			log('Please login to Duolingo and reload!');
			return;
		}

		const defaultHeaders = formatHeaders(jwt);
		const decodedJwt = decodeJwtToken(jwt);
		const sub = decodedJwt.sub;
		const userInfo = await ApiService.getUserInfo(sub, defaultHeaders);
		
		if (!userInfo || !userInfo.id) {
			uiState.disableAllControls();
			log('Failed to get user info. Please reload!');
			return;
		}

		userInfo.sub = sub;
		userManager.setUserInfo(userInfo);

		const apiService = new ApiService(jwt, defaultHeaders, userInfo, sub);
		const settingsManager = new SettingsManager(shadowRoot, apiService);
		const savedSettings = settingsManager.getSettings();

		// Generate farm options
		const skillId = extractSkillId(userInfo.currentCourse || {});
		const farmOptions = generateFarmOptions(userInfo);

		// Initialize farming controller (config sẽ đọc từ settings snapshot)
		let farmingController;
		const farmingConfig = {
			get isRunning() {
				return farmingController ? farmingController.getIsRunning() : false;
			},
			get delayTime() {
				return savedSettings.delayTime;
			},
			get retryTime() {
				return savedSettings.retryTime;
			},
			get autoStopTime() {
				return savedSettings.autoStopTime;
			}
		};

		farmingController = new FarmingController(
			apiService,
			farmingConfig,
			{
				delay: delay,
				onUpdate: (type, amount) => userManager.updateFarmResult(type, amount),
				onError: () => {}, // Will be set up after handlers are created
				onNotify: () => {}, // Will be set up after handlers are created
				onStop: () => uiState.setRunning(false),
				onAlert: (message) => alert(message)
			}
		);

		// Initialize UI handlers
		const uiHandlers = new UIHandlers(
			shadowRoot,
			farmingController,
			userManager,
			settingsManager,
			uiController,
			uiState
		);

		// Setup callbacks
		setupCallbacks(userManager, farmingController, uiHandlers, skillId, sub);

		// Populate options
		uiHandlers.populateOptions(farmOptions);

		// Initialize settings
		settingsManager.populateDefaultOptionSelect(farmOptions);
		settingsManager.loadDefaultFarmingOption(farmOptions);
		settingsManager.loadSettingsToUI();

		// Update user info display
		uiHandlers.updateUserInfo(userInfo, skillId, sub);

		// Setup event listeners
		uiHandlers.setupEventListeners();

		// Load saved settings
		uiHandlers.loadSavedSettings(savedSettings);

		uiHandlers.updateNotify('Duofarmer ready! For safety, I suggest that you use 2nd accounts.\nRecommended to use "Blank page" for best performance (check in setting)');
	} catch (err) {
		logError(err, 'Duofarmer init error!');
	}
})();
