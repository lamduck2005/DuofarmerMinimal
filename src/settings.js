export const DEFAULT_SETTINGS = {
    autoOpenUI: false,
    autoStart: false,
    defaultOption: 1,
    hideUsername: false,
    keepScreenOn: false,
    autoStopTime: 0,
    farmAnimation: false,
    delayTime: 500,
    retryTime: 1000,
    autoKeepStreak: false,
}

export function loadSettings() {
    try {
        const saved = localStorage.getItem('duofarmerSettings')
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS }
    } catch {
        return { ...DEFAULT_SETTINGS }
    }
}

export function saveSettings(settings) {
    localStorage.setItem('duofarmerSettings', JSON.stringify(settings))
}
