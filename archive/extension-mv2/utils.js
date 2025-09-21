// Enhanced error handling and validation utilities for Recipe Transformer

class RecipeTransformerError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', details = {}) {
    super(message);
    this.name = 'RecipeTransformerError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class ErrorHandler {
  static codes = {
    API_KEY_MISSING: 'API_KEY_MISSING',
    API_KEY_INVALID: 'API_KEY_INVALID',
    API_REQUEST_FAILED: 'API_REQUEST_FAILED',
    CONTENT_EXTRACTION_FAILED: 'CONTENT_EXTRACTION_FAILED',
    JSON_PARSE_FAILED: 'JSON_PARSE_FAILED',
    RECIPE_NOT_FOUND: 'RECIPE_NOT_FOUND',
    NETWORK_ERROR: 'NETWORK_ERROR',
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
    INVALID_RESPONSE: 'INVALID_RESPONSE'
  };

  static createError(code, message, details = {}) {
    return new RecipeTransformerError(message, code, details);
  }

  static handleApiError(error, response = null) {
    if (!response) {
      return this.createError(
        this.codes.NETWORK_ERROR,
        'Network error occurred while contacting the API',
        { originalError: error.message }
      );
    }

    switch (response.status) {
      case 401:
        return this.createError(
          this.codes.API_KEY_INVALID,
          'Invalid API key. Please check your Gemini API key in settings.',
          { status: response.status }
        );
      case 429:
        return this.createError(
          this.codes.QUOTA_EXCEEDED,
          'API quota exceeded. Please try again later or check your Gemini API limits.',
          { status: response.status }
        );
      case 400:
        return this.createError(
          this.codes.API_REQUEST_FAILED,
          'Bad request to API. The recipe content may be too large or malformed.',
          { status: response.status }
        );
      case 500:
      case 502:
      case 503:
        return this.createError(
          this.codes.API_REQUEST_FAILED,
          'API service temporarily unavailable. Please try again in a few minutes.',
          { status: response.status }
        );
      default:
        return this.createError(
          this.codes.API_REQUEST_FAILED,
          `API request failed with status ${response.status}`,
          { status: response.status }
        );
    }
  }

  static getUserFriendlyMessage(error) {
    const baseMessage = 'Recipe transformation failed. ';
    
    switch (error.code) {
      case this.codes.API_KEY_MISSING:
        return baseMessage + 'Please configure your Gemini API key in extension settings.';
      case this.codes.API_KEY_INVALID:
        return baseMessage + 'Your API key appears to be invalid. Please check your Gemini API key.';
      case this.codes.QUOTA_EXCEEDED:
        return baseMessage + 'API quota exceeded. Please try again later.';
      case this.codes.CONTENT_EXTRACTION_FAILED:
        return baseMessage + 'Could not extract recipe content from this page.';
      case this.codes.RECIPE_NOT_FOUND:
        return baseMessage + 'No recipe found on this page.';
      case this.codes.JSON_PARSE_FAILED:
        return baseMessage + 'Received invalid response from AI service.';
      case this.codes.NETWORK_ERROR:
        return baseMessage + 'Network connection failed. Please check your internet connection.';
      default:
        return baseMessage + error.message;
    }
  }

  static logError(error, context = {}) {
    console.error('Recipe Transformer Error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      context,
      timestamp: error.timestamp,
      stack: error.stack
    });
  }
}

// Validation utilities
class Validator {
  static isValidApiKey(apiKey) {
    return typeof apiKey === 'string' && 
           apiKey.trim().length > 0 && 
           apiKey.startsWith('AIza');
  }

  static isValidRecipeJson(json) {
    if (!json || typeof json !== 'object') return false;
    
    const required = ['@context', '@type', 'name'];
    return required.every(field => json.hasOwnProperty(field)) &&
           json['@type'] === 'Recipe' &&
           json['@context'].includes('schema.org');
  }

  static isRecipePage(url, content) {
    const recipeIndicators = [
      /recipe/i,
      /ingredient/i,
      /cooking/i,
      /baking/i,
      /kitchen/i,
      /food/i,
      /cook/i
    ];

    const urlIndicates = recipeIndicators.some(pattern => pattern.test(url));
    const contentIndicates = content && recipeIndicators.some(pattern => 
      pattern.test(content.substring(0, 1000))
    );

    return urlIndicates || contentIndicates;
  }

  static sanitizeContent(content) {
    if (!content || typeof content !== 'string') return '';
    
    // Remove excessive whitespace and normalize
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .substring(0, 50000); // Limit content length
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorHandler, Validator, RecipeTransformerError };
}
