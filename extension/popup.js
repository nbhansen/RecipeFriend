// Popup script for Recipe Transformer extension

let currentRecipeJson = null;

// DOM elements
const statusEl = document.getElementById('status');
const recipeInfoEl = document.getElementById('recipeInfo');
const recipeNameEl = document.getElementById('recipeName');
const recipeStatsEl = document.getElementById('recipeStats');
const transformBtn = document.getElementById('transformBtn');
const downloadBtn = document.getElementById('downloadBtn');
const retryBtn = document.getElementById('retryBtn');
const resultActionsEl = document.getElementById('resultActions');
const resultPreviewEl = document.getElementById('resultPreview');
const optionsLink = document.getElementById('optionsLink');

// Update status display
function showStatus(message, type = 'inactive', showSpinner = false) {
    statusEl.className = `status ${type}`;
    statusEl.innerHTML = showSpinner ? 
        `<span class="loading-spinner"></span>${message}` : 
        message;
}

// Update recipe info display
function showRecipeInfo(recipe) {
    recipeNameEl.textContent = recipe.name || 'Untitled Recipe';
    const ingredientCount = recipe.recipeIngredient?.length || 0;
    const stepCount = recipe.recipeInstructions?.length || 0;
    recipeStatsEl.textContent = `${ingredientCount} ingredients • ${stepCount} steps`;
    recipeInfoEl.classList.remove('hidden');
}

// Hide recipe info
function hideRecipeInfo() {
    recipeInfoEl.classList.add('hidden');
}

// Show result preview
function showResult(recipeJson) {
    currentRecipeJson = recipeJson;
    const preview = JSON.stringify(recipeJson, null, 2);
    resultPreviewEl.textContent = preview.length > 500 ? 
        preview.substring(0, 500) + '\n...' : 
        preview;
    resultPreviewEl.classList.remove('hidden');
    resultActionsEl.classList.remove('hidden');
    
    showRecipeInfo(recipeJson);
    showStatus('Recipe transformed successfully!', 'success');
}

// Hide result
function hideResult() {
    resultPreviewEl.classList.add('hidden');
    resultActionsEl.classList.add('hidden');
    hideRecipeInfo();
    currentRecipeJson = null;
}

// Download recipe as JSON file
function downloadRecipe() {
    if (!currentRecipeJson) return;
    
    const recipeName = currentRecipeJson.name ? 
        currentRecipeJson.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 
        'recipe';
    
    const jsonString = JSON.stringify(currentRecipeJson, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Use Chrome downloads API
    browser.downloads.download({
        url: url,
        filename: `${recipeName}.json`
    }).then(() => {
        URL.revokeObjectURL(url);
    });
}

// Transform recipe on current page
async function transformRecipe() {
    try {
        // Check if API key is configured
        const result = await browser.storage.sync.get(['geminiApiKey']);
        if (!result.geminiApiKey) {
            showStatus('API key not configured', 'error');
            setTimeout(() => {
                browser.runtime.openOptionsPage();
                window.close();
            }, 1500);
            return;
        }
        
        hideResult();
        showStatus('Extracting recipe content...', 'loading', true);
        transformBtn.disabled = true;
        
        // Get active tab
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];
        
        // Extract content from page
        const contentResult = await browser.tabs.sendMessage(activeTab.id, {
            action: 'extractRecipe'
        });
        
        if (!contentResult.success) {
            throw new Error(contentResult.error);
        }
        
        showStatus('Processing with AI...', 'loading', true);
        
        // Transform content with AI
        const transformResult = await browser.runtime.sendMessage({
            action: 'transformRecipeContent',
            content: contentResult.content
        });
        
        if (!transformResult.success) {
            throw new Error(transformResult.error);
        }
        
        showResult(transformResult.recipe);
        
    } catch (error) {
        console.error('Transform failed:', error);
        showStatus(`Error: ${error.message}`, 'error');
        hideResult();
    } finally {
        transformBtn.disabled = false;
    }
}

// Reset to initial state
function resetState() {
    hideResult();
    showStatus('Ready to transform recipe', 'inactive');
    transformBtn.disabled = false;
}

// Event listeners
transformBtn.addEventListener('click', transformRecipe);
downloadBtn.addEventListener('click', downloadRecipe);
retryBtn.addEventListener('click', resetState);
optionsLink.addEventListener('click', (e) => {
    e.preventDefault();
    browser.runtime.openOptionsPage();
    window.close();
});

// Initialize popup
async function init() {
    try {
        // Check if we're on a recipe page
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];
        
        const pageResult = await browser.tabs.sendMessage(activeTab.id, {
            action: 'checkRecipePage'
        });
        
        if (!pageResult.isRecipe) {
            showStatus('No recipe detected on this page', 'inactive');
            transformBtn.disabled = true;
        }
        
        // Check API key status
        const result = await browser.storage.sync.get(['geminiApiKey']);
        if (!result.geminiApiKey) {
            showStatus('API key not configured - click Settings', 'error');
        }
        
    } catch (error) {
        console.error('Init failed:', error);
        showStatus('Extension initialization failed', 'error');
    }
}

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', init);