// Content script for Recipe Transformer extension
// Runs on all web pages to extract recipe content

let isReadabilityLoaded = false;

// Load Readability.js library
function loadReadability() {
  return new Promise((resolve, reject) => {
    if (isReadabilityLoaded) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('readability.js');
    script.onload = () => {
      isReadabilityLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Extract readable content from the current page
async function extractRecipeContent() {
  try {
    await loadReadability();
    
    const documentClone = document.cloneNode(true);
    const reader = new Readability(documentClone);
    const article = reader.parse();
    
    if (!article) {
      throw new Error('Could not extract readable content from this page');
    }
    
    return {
      title: article.title,
      content: article.textContent,
      url: window.location.href
    };
  } catch (error) {
    throw new Error(`Content extraction failed: ${error.message}`);
  }
}

// Check if the current page looks like a recipe page
function isRecipePage() {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  const content = document.body.textContent.toLowerCase();
  
  // Look for recipe-related keywords
  const recipeKeywords = [
    'recipe', 'ingredients', 'instructions', 'cooking', 'baking',
    'preparation', 'cook time', 'prep time', 'serves', 'yield'
  ];
  
  const hasRecipeKeywords = recipeKeywords.some(keyword => 
    title.includes(keyword) || content.includes(keyword) || url.includes(keyword)
  );
  
  // Look for structured data
  const hasRecipeSchema = document.querySelector('script[type="application/ld+json"]') &&
    document.querySelector('script[type="application/ld+json"]').textContent.includes('Recipe');
  
  return hasRecipeKeywords || hasRecipeSchema;
}

// Listen for messages from popup and background scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractRecipe') {
    extractRecipeContent()
      .then(content => sendResponse({ success: true, content }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (message.action === 'checkRecipePage') {
    sendResponse({ isRecipe: isRecipePage() });
  }
});

// Notify background script about page state
function notifyPageState() {
  browser.runtime.sendMessage({
    action: 'pageStateChanged',
    isRecipe: isRecipePage(),
    url: window.location.href
  });
}

// Listen for keyboard shortcuts
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'R') {
    event.preventDefault();
    browser.runtime.sendMessage({ action: 'transformRecipe' });
  }
});

// Notify background script when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', notifyPageState);
} else {
  notifyPageState();
}

// Notify background script when URL changes (for SPAs)
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    notifyPageState();
  }
});
observer.observe(document.body, { childList: true, subtree: true });