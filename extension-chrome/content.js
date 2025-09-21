// Content script for Recipe Transformer extension (MV3)
// Extracts readable content and answers popup/background messages

// Ensure Readability is available (loaded via manifest before this file)
function ensureReadability() {
  if (typeof Readability !== 'function') {
    throw new Error('Readability failed to load in content script');
  }
}

// Heuristic: does this page look like a recipe?
function isRecipePage() {
  const url = (location.href || '').toLowerCase();
  const title = (document.title || '').toLowerCase();
  const bodyText = (document.body?.textContent || '').toLowerCase();

  const keywords = [
    'recipe', 'ingredients', 'instructions', 'cooking', 'baking',
    'preparation', 'cook time', 'prep time', 'serves', 'yield'
  ];
  const hasKeywords = keywords.some(k => title.includes(k) || bodyText.includes(k) || url.includes(k));

  let hasSchema = false;
  try {
    const el = document.querySelector('script[type="application/ld+json"]');
    hasSchema = !!(el && el.textContent && el.textContent.includes('Recipe'));
  } catch {}

  return hasKeywords || hasSchema;
}

// Extract readable content using Readability
async function extractRecipeContent() {
  ensureReadability();
  const docClone = document.cloneNode(true);
  const reader = new Readability(docClone);
  const article = reader.parse();
  if (!article) {
    throw new Error('Could not extract readable content from this page');
  }
  return {
    title: article.title || document.title || '',
    content: article.textContent || '',
    url: location.href
  };
}

// Single promise-returning message handler (polyfill-compatible)
browser.runtime.onMessage.addListener((message) => {
  const kind = message && (message.type || message.action);
  if (!kind) return;

  if (kind === 'ping') {
    return { ok: true };
  }

  if (kind === 'checkRecipePage') {
    return { success: true, isRecipe: isRecipePage() };
  }

  if (kind === 'extractContent' || kind === 'extractRecipe') {
    return extractRecipeContent()
      .then(content => ({ success: true, content }))
      .catch(err => ({ success: false, error: err.message }));
  }
});

// Notify background of page state (optional UX)
function notifyPageState() {
  try {
    browser.runtime.sendMessage({
      type: 'pageStateChanged',
      isRecipe: isRecipePage(),
      url: location.href
    }).catch(() => {});
  } catch {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => notifyPageState(), { once: true });
} else {
  notifyPageState();
}

// Watch SPA URL changes
let currentUrl = location.href;
const observer = new MutationObserver(() => {
  const now = location.href;
  if (now !== currentUrl) {
    currentUrl = now;
    notifyPageState();
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });