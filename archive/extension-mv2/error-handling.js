// Error handling utilities for Recipe Transformer
// Provides user-friendly error messages and logging

class RecipeTransformerError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'RecipeTransformerError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Error codes and their user-friendly messages
const ERROR_CODES = {
  NO_API_KEY: {
    message: 'API key not configured',
    suggestion: 'Please add your Gemini API key in the extension settings'
  },
  INVALID_API_KEY: {
    message: 'Invalid API key',
    suggestion: 'Please check your Gemini API key in the extension settings'
  },
  NETWORK_ERROR: {
    message: 'Network connection failed',
    suggestion: 'Check your internet connection and try again'
  },
  NO_RECIPE_FOUND: {
    message: 'No recipe detected on this page',
    suggestion: 'Try a different recipe website or check if the page has finished loading'
  },
  CONTENT_EXTRACTION_FAILED: {
    message: 'Could not extract content from page',
    suggestion: 'This website may not be supported. Try copying the recipe text manually'
  },
  AI_PARSING_FAILED: {
    message: 'AI could not parse the recipe',
    suggestion: 'The recipe format may be too complex. Try a simpler recipe page'
  },
  INVALID_JSON: {
    message: 'Invalid recipe data received',
    suggestion: 'Please try again or contact support if the issue persists'
  },
  QUOTA_EXCEEDED: {
    message: 'API quota exceeded',
    suggestion: 'You have reached your daily API limit. Try again tomorrow or upgrade your plan'
  }
};

// Enhanced error handler
function handleError(error) {
  console.error('Recipe Transformer Error:', error);
  
  // Determine error type and provide appropriate message
  let errorInfo = { code: 'UNKNOWN_ERROR', message: error.message };
  
  if (error.message.includes('No API key found')) {
    errorInfo = ERROR_CODES.NO_API_KEY;
  } else if (error.message.includes('API Error: 401') || error.message.includes('API Error: 403')) {
    errorInfo = ERROR_CODES.INVALID_API_KEY;
  } else if (error.message.includes('Network error') || error.message.includes('fetch')) {
    errorInfo = ERROR_CODES.NETWORK_ERROR;
  } else if (error.message.includes('No recipe detected')) {
    errorInfo = ERROR_CODES.NO_RECIPE_FOUND;
  } else if (error.message.includes('Content extraction failed')) {
    errorInfo = ERROR_CODES.CONTENT_EXTRACTION_FAILED;
  } else if (error.message.includes('Invalid JSON')) {
    errorInfo = ERROR_CODES.AI_PARSING_FAILED;
  } else if (error.message.includes('quota') || error.message.includes('429')) {
    errorInfo = ERROR_CODES.QUOTA_EXCEEDED;
  }
  
  return {
    userMessage: errorInfo.message,
    suggestion: errorInfo.suggestion,
    technicalDetails: error.message,
    timestamp: new Date().toISOString()
  };
}

// Recipe validation
function validateRecipe(recipe) {
  const errors = [];
  
  if (!recipe || typeof recipe !== 'object') {
    errors.push('Recipe data is not a valid object');
    return { isValid: false, errors };
  }
  
  // Check required fields
  if (!recipe.name || typeof recipe.name !== 'string' || recipe.name.trim() === '') {
    errors.push('Recipe name is missing or empty');
  }
  
  if (!recipe.recipeIngredient || !Array.isArray(recipe.recipeIngredient) || recipe.recipeIngredient.length === 0) {
    errors.push('Recipe ingredients are missing or empty');
  }
  
  if (!recipe.recipeInstructions || !Array.isArray(recipe.recipeInstructions) || recipe.recipeInstructions.length === 0) {
    errors.push('Recipe instructions are missing or empty');
  }
  
  // Check schema.org compliance
  if (!recipe['@context'] || !recipe['@context'].includes('schema.org')) {
    errors.push('Missing or invalid schema.org context');
  }
  
  if (!recipe['@type'] || recipe['@type'] !== 'Recipe') {
    errors.push('Missing or invalid recipe type');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// API key validation
async function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return { isValid: false, error: 'API key is empty' };
  }
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim()
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Test message'
          }]
        }],
        generationConfig: {
          maxOutputTokens: 10,
        }
      })
    });
    
    if (response.status === 401 || response.status === 403) {
      return { isValid: false, error: 'Invalid API key' };
    }
    
    if (!response.ok) {
      return { isValid: false, error: `API Error: ${response.status}` };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Network error during validation' };
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RecipeTransformerError,
    handleError,
    validateRecipe,
    validateApiKey,
    ERROR_CODES
  };
}
