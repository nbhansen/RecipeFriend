// Background script for Recipe Transformer extension
// Handles API calls and extension logic

// Import error handling utilities
// Note: In a real extension, you'd import this differently
// For now, we'll include the essential error handling inline

// Enhanced error handling
class RecipeTransformerError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'RecipeTransformerError';
    this.code = code;
  }
}

// Update extension icon based on page content
function updateIcon(tabId, isRecipe) {
  const iconPath = isRecipe ? {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  } : {
    "16": "icons/icon-disabled-16.png",
    "32": "icons/icon-disabled-32.png", 
    "48": "icons/icon-disabled-48.png",
    "128": "icons/icon-disabled-128.png"
  };
  
  browser.browserAction.setIcon({ tabId, path: iconPath });
  browser.browserAction.setTitle({ 
    tabId, 
    title: isRecipe ? "Transform Recipe" : "No recipe detected" 
  });
}

// Call Gemini API to transform recipe content
async function transformRecipeWithAI(content) {
  try {
    // Get API key from storage
    const result = await browser.storage.sync.get(['geminiApiKey']);
    const apiKey = result.geminiApiKey;
    
    if (!apiKey) {
      throw new RecipeTransformerError(
        'No API key found. Please configure your Gemini API key in extension options.',
        'API_KEY_MISSING'
      );
    }

    // Validate API key format
    if (!apiKey.startsWith('AIza')) {
      throw new RecipeTransformerError(
        'Invalid API key format. Please check your Gemini API key.',
        'API_KEY_INVALID'
      );
    }
  
  const prompt = `Extract recipe information from the following content and convert it to JSON-LD format following schema.org/Recipe specification. 

CRITICAL REQUIREMENTS:
1. Convert ALL measurements to metric units:
   - Cups flour → 120g per cup
   - Cups sugar → 200g per cup  
   - Cups liquid → 240ml per cup
   - Tablespoons → 15ml each
   - Teaspoons → 5ml each
   - Ounces → multiply by 28.35 for grams
   - Pounds → multiply by 453.6 for grams
   - Fahrenheit → Celsius using (F-32)×5/9
   - Fluid ounces → 30ml each
   - Stick of butter → 113g
   - Large egg → 50g

2. Preserve cooking context like "room temperature", "divided", "chopped", etc.

3. Return ONLY valid JSON-LD, no explanatory text.

Content:
${content.title}

${content.content}

Return the recipe as JSON-LD following this exact structure:
{
  "@context": "https://schema.org/",
  "@type": "Recipe",
  "name": "",
  "description": "",
  "recipeIngredient": [],
  "recipeInstructions": [
    {
      "@type": "HowToStep",
      "text": ""
    }
  ],
  "cookTime": "",
  "prepTime": "",
  "totalTime": "",
  "recipeYield": "",
  "recipeCategory": "",
  "recipeCuisine": "",
  "keywords": "",
  "nutrition": {
    "@type": "NutritionInformation"
  }
}`;

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    throw new RecipeTransformerError(
      `API Error: ${response.status} ${response.statusText}`,
      response.status === 401 ? 'API_KEY_INVALID' : 'API_REQUEST_FAILED'
    );
  }

  const data = await response.json();
  const recipeText = data.candidates[0].content.parts[0].text;
  
  // Extract JSON from response
  try {
    const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      return JSON.parse(recipeText);
    }
  } catch (e) {
    throw new RecipeTransformerError('Invalid JSON response from AI', 'JSON_PARSE_FAILED');
  }

  } catch (error) {
    // Enhanced error handling with specific error types
    if (error instanceof RecipeTransformerError) {
      throw error;
    }
    
    // Handle network and other errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new RecipeTransformerError('Network error. Please check your internet connection.', 'NETWORK_ERROR');
    }
    
    throw new RecipeTransformerError(`Unexpected error: ${error.message}`, 'UNKNOWN_ERROR');
  }
}

// Handle messages from content script and popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'pageStateChanged') {
    updateIcon(sender.tab.id, message.isRecipe);
  }
  
  if (message.action === 'transformRecipeContent') {
    transformRecipeWithAI(message.content)
      .then(recipeJson => sendResponse({ success: true, recipe: recipeJson }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (message.action === 'transformRecipe') {
    // Handle keyboard shortcut - forward to active tab's popup
    browser.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, { action: 'extractRecipe' })
          .then(result => {
            if (result.success) {
              transformRecipeWithAI(result.content)
                .then(recipeJson => {
                  // Show notification or open popup with result
                  browser.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon-48.png',
                    title: 'Recipe Transformed!',
                    message: `"${recipeJson.name}" is ready for download`
                  });
                })
                .catch(error => {
                  browser.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon-48.png',
                    title: 'Recipe Transform Failed',
                    message: error.message
                  });
                });
            }
          });
      });
  }
});

// Handle extension installation
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open options page on first install
    browser.runtime.openOptionsPage();
  }
});

// Handle keyboard command
browser.commands.onCommand.addListener((command) => {
  if (command === 'transform-recipe') {
    browser.runtime.sendMessage({ action: 'transformRecipe' });
  }
});