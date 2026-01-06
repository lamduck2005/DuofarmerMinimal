const SETTINGS_KEY = 'duofarmerSettings';
const TARGET_URL_REGEX = /https?:\/\/(?:[a-zA-Z0-9-]+\.)?duolingo\.[a-zA-Z]{2,6}(?:\.[a-zA-Z]{2})?\/\d{4}-\d{2}-\d{2}\/users\/.+/;

const CUSTOM_SHOP_ITEMS = {
    gold_subscription: {
        itemName: "gold_subscription",
        subscriptionInfo: {
            vendor: "STRIPE",
            renewing: true,
            isFamilyPlan: true,
            expectedExpiration: 9999999999000
        }
    }
};

function isMaxEnabled() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) return JSON.parse(saved).enableMaxPatch || false;
    } catch (e) {}
    return false;
}

function shouldIntercept(url, method = 'GET') {
    if (!isMaxEnabled()) return false;
    if (method.toUpperCase() !== 'GET') return false;
    if (url.includes('/shop-items')) return false;
    return TARGET_URL_REGEX.test(url);
}

function modifyJson(jsonText) {
    try {
        const data = JSON.parse(jsonText);
        data.hasPlus = true;
        if (!data.trackingProperties || typeof data.trackingProperties !== 'object') {
            data.trackingProperties = {};
        }
        data.trackingProperties.has_item_gold_subscription = true;
        data.shopItems = { ...data.shopItems, ...CUSTOM_SHOP_ITEMS };
        return JSON.stringify(data);
    } catch (e) {
        return jsonText;
    }
}

function removeManageSubscriptionSection(root = document) {
    const sections = root.querySelectorAll('section._3f-te');
    for (const section of sections) {
        const h2 = section.querySelector('h2._203-l');
        if (h2 && h2.textContent.trim() === 'Manage subscription') {
            section.remove();
            break;
        }
    }
}

export function initPatcher() {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    window.fetch = function (resource, options) {
        const url = resource instanceof Request ? resource.url : resource;
        const method = (resource instanceof Request) ? resource.method : (options?.method || 'GET');

        if (shouldIntercept(url, method)) {
            return originalFetch.apply(this, arguments).then(async (response) => {
                const cloned = response.clone();
                const jsonText = await cloned.text();
                const modified = modifyJson(jsonText);
                let hdrs = response.headers;
                try {
                    const obj = {};
                    response.headers.forEach((v, k) => obj[k] = v);
                    hdrs = obj;
                } catch {}
                return new Response(modified, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: hdrs
                });
            }).catch(err => { throw err; });
        }
        return originalFetch.apply(this, arguments);
    };

    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...args) {
        this._method = method;
        this._url = url;
        originalXhrOpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function () {
        if (shouldIntercept(this._url, this._method)) {
            const originalOnReadyStateChange = this.onreadystatechange;
            const xhr = this;
            this.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const modifiedText = modifyJson(xhr.responseText);
                        Object.defineProperty(xhr, 'responseText', { writable: true, value: modifiedText });
                        Object.defineProperty(xhr, 'response', { writable: true, value: modifiedText });
                    } catch (e) {}
                }
                if (originalOnReadyStateChange) originalOnReadyStateChange.apply(this, arguments);
            };
        }
        originalXhrSend.apply(this, arguments);
    };

    const manageSubObserver = new MutationObserver(() => {
        if (isMaxEnabled()) removeManageSubscriptionSection();
    });
    manageSubObserver.observe(document.documentElement, { childList: true, subtree: true });
}
