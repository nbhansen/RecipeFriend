// Options page script for Recipe Transformer extension

// DOM elements
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const testApiKeyBtn = document.getElementById('testApiKey');
const clearApiKeyBtn = document.getElementById('clearApiKey');
const apiStatusEl = document.getElementById('apiStatus');

const autoDetectCheckbox = document.getElementById('autoDetect');
const showNotificationsCheckbox = document.getElementById('showNotifications');
const defaultFormatSelect = document.getElementById('defaultFormat');
const savePreferencesBtn = document.getElementById('savePreferences');
const prefStatusEl = document.getElementById('prefStatus');

const recipeCountEl = document.getElementById('recipeCount');
const installDateEl = document.getElementById('installDate');
const resetStatsBtn = document.getElementById('resetStats');

const exportSettingsBtn = document.getElementById('exportSettings');
const importSettingsBtn = document.getElementById('importSettings');
const resetAllBtn = document.getElementById('resetAll');
const importFileInput = document.getElementById('importFile');

// Show status message
function showStatus(element, message, type = 'info', duration = 3000) {
    element.textContent = message;
    element.className = `status ${type}`;
    element.classList.remove('hidden');
    
    if (duration > 0) {
        setTimeout(() => {
            element.classList.add('hidden');
        }, duration);
    }
}

// Load current settings
async function loadSettings() {
    try {
        const result = await browser.storage.sync.get([
            'geminiApiKey',
            'autoDetect',
            'showNotifications', 
            'defaultFormat',
            'recipeCount',
            'installDate'
        ]);
        
        // API Key (don't show the actual key for security)
        if (result.geminiApiKey) {
            apiKeyInput.placeholder = 'API key saved (click to change)';
        }
        
        // Preferences
        autoDetectCheckbox.checked = result.autoDetect !== false; // default true
        showNotificationsCheckbox.checked = result.showNotifications !== false; // default true
        defaultFormatSelect.value = result.defaultFormat || 'json-ld';
        
        // Statistics
        recipeCountEl.textContent = result.recipeCount || 0;
        installDateEl.textContent = result.installDate ? 
            new Date(result.installDate).toLocaleDateString() : 
            'Unknown';
            
    } catch (error) {
        console.error('Failed to load settings:', error);
        showStatus(apiStatusEl, 'Failed to load settings', 'error');
    }
}

// Save API key
async function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        showStatus(apiStatusEl, 'Please enter an API key', 'error');
        return;
    }
    
    try {
        await browser.storage.sync.set({ geminiApiKey: apiKey });
        showStatus(apiStatusEl, 'API key saved successfully!', 'success');
        apiKeyInput.value = '';
        apiKeyInput.placeholder = 'API key saved (click to change)';
    } catch (error) {
        console.error('Failed to save API key:', error);
        showStatus(apiStatusEl, 'Failed to save API key', 'error');
    }
}

// Test API connection
async function testApiKey() {
    try {
        showStatus(apiStatusEl, 'Testing connection...', 'info', 0);
        testApiKeyBtn.disabled = true;
        
        const result = await browser.storage.sync.get(['geminiApiKey']);
        const apiKey = result.geminiApiKey;
        
        if (!apiKey) {
            showStatus(apiStatusEl, 'No API key found. Please save your key first.', 'error');
            return;
        }
        
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Hello, respond with just the word "SUCCESS" if you receive this.'
                    }]
                }]
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            showStatus(apiStatusEl, 'API connection successful! ✅', 'success');
        } else {
            showStatus(apiStatusEl, `API Error: ${response.status} ${response.statusText}`, 'error');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        showStatus(apiStatusEl, `Connection failed: ${error.message}`, 'error');
    } finally {
        testApiKeyBtn.disabled = false;
    }
}

// Clear API key
async function clearApiKey() {
    if (!confirm('Are you sure you want to clear your API key?')) {
        return;
    }
    
    try {
        await browser.storage.sync.remove('geminiApiKey');
        showStatus(apiStatusEl, 'API key cleared', 'success');
        apiKeyInput.placeholder = 'Enter your Gemini API key';
    } catch (error) {
        console.error('Failed to clear API key:', error);
        showStatus(apiStatusEl, 'Failed to clear API key', 'error');
    }
}

// Save preferences
async function savePreferences() {
    try {
        await browser.storage.sync.set({
            autoDetect: autoDetectCheckbox.checked,
            showNotifications: showNotificationsCheckbox.checked,
            defaultFormat: defaultFormatSelect.value
        });
        
        showStatus(prefStatusEl, 'Preferences saved!', 'success');
    } catch (error) {
        console.error('Failed to save preferences:', error);
        showStatus(prefStatusEl, 'Failed to save preferences', 'error');
    }
}

// Reset statistics
async function resetStats() {
    if (!confirm('Are you sure you want to reset all statistics?')) {
        return;
    }
    
    try {
        await browser.storage.sync.set({
            recipeCount: 0,
            installDate: Date.now()
        });
        
        recipeCountEl.textContent = '0';
        installDateEl.textContent = new Date().toLocaleDateString();
        
        showStatus(prefStatusEl, 'Statistics reset', 'success');
    } catch (error) {
        console.error('Failed to reset stats:', error);
        showStatus(prefStatusEl, 'Failed to reset statistics', 'error');
    }
}

// Export settings
async function exportSettings() {
    try {
        const settings = await browser.storage.sync.get();
        
        // Don't export API key for security
        const exportData = { ...settings };
        delete exportData.geminiApiKey;
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recipe-transformer-settings.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showStatus(prefStatusEl, 'Settings exported (API key excluded)', 'success');
    } catch (error) {
        console.error('Failed to export settings:', error);
        showStatus(prefStatusEl, 'Failed to export settings', 'error');
    }
}

// Import settings
function importSettings() {
    importFileInput.click();
}

// Handle file import
async function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const settings = JSON.parse(text);
        
        // Validate settings structure
        const validKeys = ['autoDetect', 'showNotifications', 'defaultFormat', 'recipeCount', 'installDate'];
        const filteredSettings = {};
        
        for (const key of validKeys) {
            if (settings.hasOwnProperty(key)) {
                filteredSettings[key] = settings[key];
            }
        }
        
        await browser.storage.sync.set(filteredSettings);
        await loadSettings();
        
        showStatus(prefStatusEl, 'Settings imported successfully!', 'success');
    } catch (error) {
        console.error('Failed to import settings:', error);
        showStatus(prefStatusEl, 'Failed to import settings', 'error');
    }
    
    importFileInput.value = '';
}

// Reset all settings
async function resetAll() {
    if (!confirm('Are you sure you want to reset ALL settings? This cannot be undone.')) {
        return;
    }
    
    try {
        await browser.storage.sync.clear();
        
        // Set install date
        await browser.storage.sync.set({
            installDate: Date.now(),
            recipeCount: 0
        });
        
        await loadSettings();
        showStatus(prefStatusEl, 'All settings reset', 'success');
    } catch (error) {
        console.error('Failed to reset settings:', error);
        showStatus(prefStatusEl, 'Failed to reset settings', 'error');
    }
}

// Event listeners
saveApiKeyBtn.addEventListener('click', saveApiKey);
testApiKeyBtn.addEventListener('click', testApiKey);
clearApiKeyBtn.addEventListener('click', clearApiKey);
savePreferencesBtn.addEventListener('click', savePreferences);
resetStatsBtn.addEventListener('click', resetStats);
exportSettingsBtn.addEventListener('click', exportSettings);
importSettingsBtn.addEventListener('click', importSettings);
importFileInput.addEventListener('change', handleFileImport);
resetAllBtn.addEventListener('click', resetAll);

// Allow Enter key to save API key
apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        saveApiKey();
    }
});

// Initialize install date if not set
async function initializeExtension() {
    const result = await browser.storage.sync.get(['installDate']);
    if (!result.installDate) {
        await browser.storage.sync.set({
            installDate: Date.now(),
            recipeCount: 0
        });
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeExtension();
    loadSettings();
});