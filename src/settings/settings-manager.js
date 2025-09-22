import { logError, log, getJwtToken } from "../utils/utils";

export class SettingsManager {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
        this.DEFAULT_SETTINGS = {
            autoOpenUI: false,
            autoStart: false,
            defaultOption: 1, // index of option in OPTIONS array (0-based)
            hideUsername: false,
            keepScreenOn: false,
            delayTime: 500,
            retryTime: 1000,
            autoStopTime: 0,
            darkMode: false,
            compactUI: false,
            showProgress: false,
            fontSize: 'medium'
        };
        this.settings = this.loadSettings();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('duofarmerSettings');
            if (saved) {
                return { ...this.DEFAULT_SETTINGS, ...JSON.parse(saved) };
            }
            return { ...this.DEFAULT_SETTINGS };
        } catch (error) {
            logError('Settings load error:', error);
            return { ...this.DEFAULT_SETTINGS };
        }
    }

    saveSettings(settings) {
        this.settings = settings;
        localStorage.setItem('duofarmerSettings', JSON.stringify(settings));
    }

    getSettings() {
        return { ...this.settings };
    }

    loadSettingsToUI() {
        const elements = this.getElements();

        if (elements.autoOpenUI) elements.autoOpenUI.checked = this.settings.autoOpenUI;
        if (elements.autoStart) elements.autoStart.checked = this.settings.autoStart;
        if (elements.defaultOption) elements.defaultOption.value = this.settings.defaultOption.toString();
        if (elements.hideUsername) elements.hideUsername.checked = this.settings.hideUsername;
        if (elements.keepScreenOn) elements.keepScreenOn.checked = this.settings.keepScreenOn;
        if (elements.delayTime) elements.delayTime.value = this.settings.delayTime;
        if (elements.retryTime) elements.retryTime.value = this.settings.retryTime;
        if (elements.autoStopTime) elements.autoStopTime.value = this.settings.autoStopTime;
        if (elements.darkMode) elements.darkMode.checked = this.settings.darkMode;
        if (elements.compactUI) elements.compactUI.checked = this.settings.compactUI;
        if (elements.showProgress) elements.showProgress.checked = this.settings.showProgress;
        if (elements.fontSize) elements.fontSize.value = this.settings.fontSize;
    }

    saveSettingsFromUI() {
        const elements = this.getElements();
        const settings = {
            autoOpenUI: elements.autoOpenUI?.checked || false,
            autoStart: elements.autoStart?.checked || false,
            defaultOption: parseInt(elements.defaultOption?.value) || 1, // index in OPTIONS array
            hideUsername: elements.hideUsername?.checked || false,
            keepScreenOn: elements.keepScreenOn?.checked || false,
            delayTime: parseInt(elements.delayTime?.value) || 500,
            retryTime: parseInt(elements.retryTime?.value) || 1000,
            autoStopTime: parseInt(elements.autoStopTime?.value) || 0,
            darkMode: elements.darkMode?.checked || false,
            compactUI: elements.compactUI?.checked || false,
            showProgress: elements.showProgress?.checked || false,
            fontSize: elements.fontSize?.value || 'medium'
        };

        this.saveSettings(settings);
        return settings;
    }

    getElements() {
        return {
            autoOpenUI: this.shadowRoot.getElementById('auto-open-ui'),
            autoStart: this.shadowRoot.getElementById('auto-start'),
            defaultOption: this.shadowRoot.getElementById('default-option'),
            hideUsername: this.shadowRoot.getElementById('hide-username'),
            keepScreenOn: this.shadowRoot.getElementById('keep-screen-on'),
            delayTime: this.shadowRoot.getElementById('delay-time'),
            retryTime: this.shadowRoot.getElementById('retry-time'),
            autoStopTime: this.shadowRoot.getElementById('auto-stop-time'),
            darkMode: this.shadowRoot.getElementById('dark-mode'),
            compactUI: this.shadowRoot.getElementById('compact-ui'),
            showProgress: this.shadowRoot.getElementById('show-progress'),
            fontSize: this.shadowRoot.getElementById('font-size'),
            saveSettings: this.shadowRoot.getElementById('save-settings'),
            quickLogout: this.shadowRoot.getElementById('quick-logout'),
            resetTheme: this.shadowRoot.getElementById('reset-theme'),
            getJwtToken: this.shadowRoot.getElementById('get-jwt-token'),
            resetSetting: this.shadowRoot.getElementById('reset-setting'),
            settingsContainer: this.shadowRoot.getElementById('settings-container')
        };
    }

    addEventListeners() {
        const elements = this.getElements();
        elements.saveSettings.addEventListener('click', () => {
            this.saveSettingsFromUI();
            alert('Settings saved successfully, reload the page to apply changes!');
            confirm('Reload now?') && location.reload();
        });

        elements.quickLogout.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
               window.location.href = 'https://www.duolingo.com/logout';
            }
        });

        elements.resetTheme.addEventListener('click', () => {
            //todo
        });

        elements.getJwtToken.addEventListener('click', () => {
            const token = getJwtToken();
            if (token) {
                confirm(`Your JWT Token:\n\n${token}\n\nCopy to clipboard?`) && navigator.clipboard.writeText(token);
            }
        });

        elements.resetSetting.addEventListener('click', () => {
            if (confirm('Reset all settings to default? This cannot be undone.')) {
                localStorage.removeItem('duofarmerSettings');
                this.settings = { ...this.DEFAULT_SETTINGS };
                this.loadSettingsToUI();
                alert('All settings reset successfully! Reload to apply changes.');
            }
        });
    }

    addEventSettings(container) {
        const elements = this.getElements();
        const settingsBtn = this.shadowRoot.getElementById('settings-btn');
        const settingsContainer = elements.settingsContainer;
        const settingsClose = this.shadowRoot.getElementById('settings-close');

        const toggleModal = (modalElement, mainElement) => ({
            show: () => {
                mainElement.style.display = 'none';
                modalElement.style.display = 'flex';
            },
            hide: () => {
                modalElement.style.display = 'none';
                mainElement.style.display = 'flex';
            }
        });

        const settingsModal = toggleModal(settingsContainer, container);

        settingsBtn.addEventListener('click', settingsModal.show);
        settingsClose.addEventListener('click', settingsModal.hide);
    }

    loadDefaultFarmingOption(optionsArray) {
        const select = this.shadowRoot.getElementById('select-option');
        const optionIndex = this.settings.defaultOption; // index in OPTIONS array
        select.selectedIndex = optionIndex;
    }

    populateDefaultOptionSelect(optionsArray) {
        const select = this.shadowRoot.getElementById('default-option');
        select.innerHTML = '';
        optionsArray.forEach((opt, index) => { // index is 0-based position in OPTIONS array
            const option = document.createElement('option');
            option.value = index.toString();
            option.textContent = opt.label;
            if (opt.disabled) option.disabled = true;
            select.appendChild(option);
        });
    }
}