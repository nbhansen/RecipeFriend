// Lightweight Promise-based shim for Chrome to provide a browser.* API.
// Prefer the official webextension-polyfill; this shim is a safe fallback.
// Only wraps the APIs used in this extension.

(function () {
  if (typeof window !== 'undefined' && typeof window.browser !== 'undefined') {
    return; // browser API already present (Firefox or polyfill loaded)
  }
  if (typeof chrome === 'undefined') {
    return; // Not in an extension context
  }

  function promisify(fn) {
    return function (...args) {
      return new Promise((resolve, reject) => {
        try {
          fn.call(null, ...args, (result) => {
            const err = chrome.runtime && chrome.runtime.lastError;
            if (err) reject(err);
            else resolve(result);
          });
        } catch (e) {
          reject(e);
        }
      });
    };
  }

  const browser = {};

  // runtime
  browser.runtime = Object.assign({}, chrome.runtime, {
    sendMessage: promisify(chrome.runtime.sendMessage),
    openOptionsPage: chrome.runtime.openOptionsPage
      ? promisify(chrome.runtime.openOptionsPage)
      : undefined,
    getURL: chrome.runtime.getURL,
    onMessage: chrome.runtime.onMessage,
    onInstalled: chrome.runtime.onInstalled
  });

  // tabs
  if (chrome.tabs) {
    browser.tabs = Object.assign({}, chrome.tabs, {
      query: promisify(chrome.tabs.query),
      sendMessage: promisify(chrome.tabs.sendMessage)
    });
  }

  // storage
  if (chrome.storage && chrome.storage.sync) {
    browser.storage = { sync: {
      get: promisify(chrome.storage.sync.get),
      set: promisify(chrome.storage.sync.set),
      remove: promisify(chrome.storage.sync.remove),
      clear: promisify(chrome.storage.sync.clear)
    }};
  }

  // downloads
  if (chrome.downloads) {
    browser.downloads = Object.assign({}, chrome.downloads, {
      download: promisify(chrome.downloads.download)
    });
  }

  // notifications
  if (chrome.notifications) {
    browser.notifications = Object.assign({}, chrome.notifications, {
      create: promisify(chrome.notifications.create)
    });
  }

  // action (no promises required for setters)
  if (chrome.action) {
    browser.action = chrome.action;
  }

  // commands
  if (chrome.commands) {
    browser.commands = chrome.commands;
  }

  // Expose
  if (typeof window !== 'undefined') {
    window.browser = browser;
  } else if (typeof self !== 'undefined') {
    self.browser = browser;
  }
})();
