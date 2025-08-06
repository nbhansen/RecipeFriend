// Background script for Recipe Transformer extension - Manifest V3 compatible
// Handles API calls and extension logic

// Compatibility layer for both Manifest V2 and V3
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
const isManifestV3 = typeof browser === 'undefined' || !browser.browserAction;

// Update extension icon based on page content
function updateIcon(tabId, isRecipe) {
  const iconPath = isRecipe ? {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  } : {
    "16": "icons/icon-16.png", // Using same icons for now since we don't have disabled versions
    "32": "icons/icon-32.png", 
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  };
  
  const actionAPI = isManifestV3 ? browserAPI.action : browserAPI.browserAction;
  
  actionAPI.setIcon({ tabId, path: iconPath });
  actionAPI.setTitle({ 
    tabId, 
    title: isRecipe ? "Transform Recipe" : "No recipe detected" 
  });
}

// Call Gemini API to transform recipe content
async function transformRecipeWithAI(content) {
  // Get API key from storage
  const result = await browserAPI.storage.sync.get(['geminiApiKey']);
  const apiKey = result.geminiApiKey;
  
  if (!apiKey) {
    throw new Error('No API key found. Please configure your Gemini API key in extension options.');
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

  try {
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
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response structure from Gemini API');
    }
    
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
      throw new Error('Invalid JSON response from AI: ' + e.message);
    }
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Gemini API. Check your internet connection.');
    }
    throw error;
  }
}

// Handle messages from content script and popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    browserAPI.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        browserAPI.tabs.sendMessage(tabs[0].id, { action: 'extractRecipe' })
          .then(result => {
            if (result && result.success) {
              transformRecipeWithAI(result.content)
                .then(recipeJson => {
                  // Show notification
                  browserAPI.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon-48.png',
                    title: 'Recipe Transformed!',
                    message: `"${recipeJson.name}" is ready for download`
                  });
                })
                .catch(error => {
                  browserAPI.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon-48.png',
                    title: 'Recipe Transform Failed',
                    message: error.message
                  });
                });
            }
          })
          .catch(error => {
            browserAPI.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon-48.png',
              title: 'Recipe Transform Failed',
              message: 'No recipe found on this page'
            });
          });
      });
  }
});

// Handle extension installation
browserAPI.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open options page on first install
    browserAPI.runtime.openOptionsPage();
    
    // Set initial stats
    browserAPI.storage.sync.set({
      'installDate': new Date().toISOString(),
      'recipeCount': 0
    });
  }
});

// Handle keyboard command
browserAPI.commands.onCommand.addListener((command) => {
  if (command === 'transform-recipe') {
    browserAPI.runtime.sendMessage({ action: 'transformRecipe' });
  }
});
