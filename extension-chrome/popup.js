// Popup script for Recipe Transformer extension
console.log('[POPUP] loaded v1.0.2 at', new Date().toISOString());

let currentRecipeJson = null;

// DOM elements
const statusEl = document.getElementById('status');
const recipeInfoEl = document.getElementById('recipeInfo');
const recipeNameEl = document.getElementById('recipeName');
const recipeStatsEl = document.getElementById('recipeStats');
const transformBtn = document.getElementById('transformBtn');
const diagBtn = document.getElementById('diagBtn');
const downloadBtn = document.getElementById('downloadBtn');
const retryBtn = document.getElementById('retryBtn');
const resultActionsEl = document.getElementById('resultActions');
const resultPreviewEl = document.getElementById('resultPreview');
const diagLogEl = document.getElementById('diagLog');
const recentSectionEl = document.getElementById('recentSection');
const recentListEl = document.getElementById('recentList');
const optionsLink = document.getElementById('optionsLink');

// Status helpers
function showStatus(message, type = 'inactive', showSpinner = false) {
  statusEl.className = `status ${type}`;
  statusEl.innerHTML = showSpinner ? `<span class="loading-spinner"></span>${message}` : message;
}
function showRecipeInfo(recipe) {
  recipeNameEl.textContent = recipe.name || 'Untitled Recipe';
  const ingredientCount = recipe.recipeIngredient?.length || 0;
  const stepCount = recipe.recipeInstructions?.length || 0;
  recipeStatsEl.textContent = `${ingredientCount} ingredients • ${stepCount} steps`;
  recipeInfoEl.classList.remove('hidden');
}
function hideRecipeInfo() {
  recipeInfoEl.classList.add('hidden');
}
function showResult(recipeJson) {
  currentRecipeJson = recipeJson;
  const preview = JSON.stringify(recipeJson, null, 2);
  resultPreviewEl.textContent = preview.length > 500 ? preview.substring(0, 500) + '\n...' : preview;
  resultPreviewEl.classList.remove('hidden');
  resultActionsEl.classList.remove('hidden');
  showRecipeInfo(recipeJson);
  showStatus('Recipe transformed successfully!', 'success');
  // Save to recent
  saveRecent(recipeJson).catch(() => {});
  // Refresh recent list
  renderRecent().catch(() => {});
}
function hideResult() {
  resultPreviewEl.classList.add('hidden');
  resultActionsEl.classList.add('hidden');
  hideRecipeInfo();
  currentRecipeJson = null;
}

// Recent history helpers
async function saveRecent(recipe) {
  const entry = {
    name: recipe?.name || 'Untitled Recipe',
    time: Date.now()
  };
  const { recentRecipes } = await browser.storage.local.get(['recentRecipes']);
  const list = Array.isArray(recentRecipes) ? recentRecipes : [];
  list.unshift(entry);
  const deduped = list
    .filter((v, i, a) => a.findIndex(x => x.name === v.name) === i)
    .slice(0, 5);
  await browser.storage.local.set({ recentRecipes: deduped });
}

async function renderRecent() {
  const { recentRecipes } = await browser.storage.local.get(['recentRecipes']);
  const list = Array.isArray(recentRecipes) ? recentRecipes : [];
  if (!list.length) {
    recentSectionEl.classList.add('hidden');
    return;
  }
  recentSectionEl.classList.remove('hidden');
  recentListEl.innerHTML = '';
  for (const item of list) {
    const li = document.createElement('li');
    const when = new Date(item.time).toLocaleString();
    li.textContent = `${item.name} — ${when}`;
    recentListEl.appendChild(li);
  }
}

function logDiag(line) {
  diagLogEl.classList.remove('hidden');
  const ts = new Date().toLocaleTimeString();
  diagLogEl.textContent += `[${ts}] ${line}\n`;
  diagLogEl.scrollTop = diagLogEl.scrollHeight;
}

function downloadRecipe() {
  if (!currentRecipeJson) return;
  const recipeName = currentRecipeJson.name
    ? currentRecipeJson.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    : 'recipe';
  const jsonString = JSON.stringify(currentRecipeJson, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  browser.downloads.download({ url, filename: `${recipeName}.json` }).then(() => {
    URL.revokeObjectURL(url);
  });
}

async function transformRecipe() {
  try {
    let tabs;
    try {
      tabs = await browser.tabs.query({ active: true, currentWindow: true });
    } catch (e) {
      console.error('[POPUP] tabs.query failed', e);
    }
    console.log('[POPUP] tabs result', Array.isArray(tabs) ? tabs.length : typeof tabs, tabs && tabs[0]);
    const tab = Array.isArray(tabs) && tabs.length ? tabs[0] : null;
    if (!tab) {
      showStatus('No active tab detected. Focus a normal website tab and try again.', 'inactive');
      return;
    }

    // Ensure CS is present
    try {
      await browser.tabs.sendMessage(tab.id, { type: 'ping' });
    } catch {
      showStatus('Content script not loaded. Refresh the page and try again.');
      return;
    }

    // API key check first
    const { geminiApiKey } = await browser.storage.sync.get(['geminiApiKey']);
    if (!geminiApiKey) {
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

    // Single extraction call
    const extractResp = await browser.tabs.sendMessage(tab.id, { type: 'extractContent' });
    if (!extractResp || extractResp.success !== true) {
      throw new Error(extractResp?.error || 'Content extraction failed');
    }

    showStatus('Processing with AI...', 'loading', true);

    const transformResp = await browser.runtime.sendMessage({
      type: 'transformRecipeContent',
      content: extractResp.content
    });

    if (!transformResp || transformResp.success !== true) {
      throw new Error(transformResp?.error || 'AI transform failed');
    }

    showResult(transformResp.recipe);
  } catch (error) {
    console.error('Transform failed:', error);
    showStatus(`Error: ${error.message}`, 'error');
    hideResult();
  } finally {
    transformBtn.disabled = false;
  }
}

function resetState() {
  hideResult();
  showStatus('Ready to transform recipe', 'inactive');
  transformBtn.disabled = false;
}

transformBtn.addEventListener('click', transformRecipe);
downloadBtn.addEventListener('click', downloadRecipe);
retryBtn.addEventListener('click', resetState);
diagBtn.addEventListener('click', runDiagnostics);
optionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  browser.runtime.openOptionsPage();
  window.close();
});

async function init() {
  try {
    let tabs;
    try {
      tabs = await browser.tabs.query({ active: true, currentWindow: true });
    } catch (e) {
      console.error('[POPUP] tabs.query failed (init)', e);
    }
    console.log('[POPUP] init tabs result', Array.isArray(tabs) ? tabs.length : typeof tabs, tabs && tabs[0]);
    const tab = Array.isArray(tabs) && tabs.length ? tabs[0] : null;
    if (!tab) {
      showStatus('No active tab detected. Open a normal website and re-open the popup.', 'inactive');
      transformBtn.disabled = true;
      return;
    }
    const url = tab.url || '';
    if (!/^https?:/i.test(url)) {
      showStatus('This page is not supported (chrome://, web store, etc.). Open a normal website.', 'inactive');
      transformBtn.disabled = true;
      return;
    }

    try {
      await browser.tabs.sendMessage(tab.id, { type: 'ping' });
    } catch {
      showStatus('Content script not loaded on this page. Refresh and try again.', 'inactive');
      transformBtn.disabled = true;
      return;
    }

    // Unified message schema: use type
    const pageResult = await browser.tabs.sendMessage(tab.id, { type: 'checkRecipePage' });
    if (!pageResult || pageResult.success !== true) {
      showStatus('Could not determine if this is a recipe page.', 'inactive');
    } else if (!pageResult.isRecipe) {
      showStatus('No recipe detected on this page', 'inactive');
      transformBtn.disabled = false; // allow manual try if you want; or set true to disable
    }

    const { geminiApiKey } = await browser.storage.sync.get(['geminiApiKey']);
    if (!geminiApiKey) {
      showStatus('API key not configured - click Settings', 'error');
    } else {
      showStatus('Ready to transform recipe', 'inactive');
    }
    // Render recent list on load
    renderRecent().catch(() => {});
  } catch (e) {
    console.error('Init failed:', e);
    showStatus(`Init failed: ${e.message}`, 'error');
  }
}

document.addEventListener('DOMContentLoaded', init);

// Diagnostics flow: ping -> check -> extract -> transform with step logs
async function runDiagnostics() {
  diagLogEl.textContent = '';
  logDiag('Starting diagnostics...');
  let tabs;
  try {
    tabs = await browser.tabs.query({ active: true, currentWindow: true });
  } catch (e) {
    logDiag(`tabs.query failed: ${e.message}`);
    return;
  }
  logDiag(`tabs length: ${Array.isArray(tabs) ? tabs.length : 'n/a'}`);
  const tab = Array.isArray(tabs) && tabs.length ? tabs[0] : null;
  if (!tab) {
    logDiag('No active tab.');
    return;
  }
  logDiag(`tab url: ${tab.url}`);
  try {
    await browser.tabs.sendMessage(tab.id, { type: 'ping' });
    logDiag('ping ok');
  } catch (e) {
    logDiag(`ping failed: ${e.message}`);
    return;
  }
  let pageResult;
  try {
    pageResult = await browser.tabs.sendMessage(tab.id, { type: 'checkRecipePage' });
    logDiag(`checkRecipePage -> ${JSON.stringify(pageResult)}`);
  } catch (e) {
    logDiag(`checkRecipePage failed: ${e.message}`);
  }
  let extractResp;
  try {
    extractResp = await browser.tabs.sendMessage(tab.id, { type: 'extractContent' });
    logDiag(`extractContent -> success=${!!extractResp?.success}`);
  } catch (e) {
    logDiag(`extractContent failed: ${e.message}`);
    return;
  }
  if (!extractResp || extractResp.success !== true) {
    logDiag(`extractContent error: ${extractResp?.error || 'unknown'}`);
    return;
  }
  let transformResp;
  try {
    transformResp = await browser.runtime.sendMessage({ type: 'transformRecipeContent', content: extractResp.content });
    logDiag(`transform -> success=${!!transformResp?.success}`);
  } catch (e) {
    logDiag(`transform failed: ${e.message}`);
    return;
  }
  if (!transformResp || transformResp.success !== true) {
    logDiag(`transform error: ${transformResp?.error || 'unknown'}`);
    return;
  }
  showResult(transformResp.recipe);
  logDiag('Diagnostics finished successfully.');
}