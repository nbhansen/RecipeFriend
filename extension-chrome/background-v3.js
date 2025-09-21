// Background script for Recipe Transformer extension - Manifest V3 compatible
// Uses official webextension-polyfill for Promise-based browser APIs
importScripts('lib/browser-polyfill.min.js');

// Update only the title to avoid referencing missing icon assets in unpacked Chrome load
function updateIcon(tabId, isRecipe) {
	if (browser.action && browser.action.setTitle) {
		browser.action.setTitle({
			tabId,
			title: isRecipe ? "Transform Recipe" : "No recipe detected"
		});
	}
}

// 1x1 transparent PNG data URL to use for notifications (no external icons required)
const NOTIF_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

// Call Gemini API to transform recipe content
async function transformRecipeWithAI(content) {
	// Get API key from storage
	const result = await browser.storage.sync.get(['geminiApiKey']);
	const apiKey = result.geminiApiKey;
  
	if (!apiKey) {
		throw new Error('No API key found. Please configure your Gemini API key in extension options.');
	}
  
	// Helper: truncate overly long page text to keep prompt size reasonable
	function truncate(str, maxChars) {
		if (!str || typeof str !== 'string') return '';
		if (str.length <= maxChars) return str;
		return str.slice(0, maxChars) + '\n…';
	}

	// Keep the input manageable to avoid MAX_TOKENS finishes
	const MAX_INPUT_CHARS = 12000; // ~a few thousand tokens
	const safeTitle = (content && content.title) ? String(content.title) : '';
	const safeBody = (content && content.content) ? String(content.content) : '';
	const clippedBody = truncate(safeBody, MAX_INPUT_CHARS);

	const prompt = `Extract recipe information from the following content and convert it to JSON-LD format following schema.org/Recipe specification.

IMPORTANT OUTPUT RULES (STRICT JSON ONLY):
- Return ONLY raw JSON, no markdown, no backticks, no comments, no prose.
- Use standard ASCII double quotes (\"\") for all JSON strings and keys.
- Do NOT include trailing commas.
- Escape all embedded newlines and quotes inside strings properly.
- Ensure the result parses with JSON.parse without modifications.
- It must be valid JSON-LD for a single Recipe object.

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
${safeTitle}

${clippedBody}

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
					temperature: 0.0,
					maxOutputTokens: 4096,
					response_mime_type: 'application/json'
				}
			})
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();

		// Handle model block reasons early
		if (data.promptFeedback && data.promptFeedback.blockReason) {
			throw new Error(`Model blocked: ${data.promptFeedback.blockReason}`);
		}

		if (!Array.isArray(data.candidates) || data.candidates.length === 0) {
			throw new Error('No candidates returned by Gemini API');
		}

		// Safely extract JSON text from candidates (supports text and inline_data JSON)
		function pickText(d) {
			for (const cand of d.candidates) {
				const parts = cand?.content?.parts;
				if (!Array.isArray(parts)) continue;
				// 1) Prefer first non-empty text part
				for (const p of parts) {
					if (typeof p?.text === 'string' && p.text.trim()) {
						return p.text;
					}
				}
				// 2) Fallback: inline_data JSON (base64-encoded)
				for (const p of parts) {
					const id = p?.inline_data;
					if (id && typeof id?.data === 'string' && typeof id?.mime_type === 'string' && /json/i.test(id.mime_type)) {
						try {
							// atob is available in MV3 SW
							const decoded = atob(id.data);
							if (decoded && decoded.trim()) return decoded;
						} catch (_) { /* ignore decode errors */ }
					}
				}
			}
			return undefined;
		}

		let recipeText = pickText(data);
		if (!recipeText) {
			try {
				console.warn('[BG] Unexpected Gemini response shape:', JSON.stringify(data).slice(0, 1200));
			} catch (_) {}
			const fin = data?.candidates?.[0]?.finishReason || 'unknown';
			// If truncated, try a concise fallback request
			if (fin === 'MAX_TOKENS') {
				const minimalPrompt = `From the content below, output ONLY a concise JSON-LD Recipe with these fields:
{
  "@context": "https://schema.org/",
  "@type": "Recipe",
  "name": "",
  "recipeIngredient": [],
  "recipeInstructions": [{"@type":"HowToStep","text":""}]
}

Rules:
- Keep strings short and relevant. Max 30 ingredients and 30 steps.
- Metric units only. No prose. Only raw JSON.

Content:
${safeTitle}

${truncate(safeBody, Math.min(8000, MAX_INPUT_CHARS))}`;

				const retryResp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-goog-api-key': apiKey
					},
					body: JSON.stringify({
						contents: [{ parts: [{ text: minimalPrompt }] }],
						generationConfig: { temperature: 0.0, maxOutputTokens: 3072, response_mime_type: 'application/json' }
					})
				});
				if (!retryResp.ok) {
					throw new Error(`API Error (retry): ${retryResp.status} ${retryResp.statusText}`);
				}
				const retryData = await retryResp.json();
				recipeText = pickText(retryData);
			}
			if (!recipeText) {
				throw new Error(`No text content found in Gemini response (finishReason: ${fin})`);
			}
		}

		// Robust JSON extraction and repair: handle fences, BOM, smart quotes, trailing commas
		function extractJson(text) {
			if (!text) throw new Error('Empty response');
			// 1) Prefer fenced code block content if present
			const fence = text.match(/```(?:json|ld\+json)?\s*([\s\S]*?)```/i);
			if (fence && fence[1]) {
				text = fence[1];
			}
			// 2) Trim BOM/whitespace
			text = text.replace(/^\uFEFF/, '').trim();
			// Helper: attempt minimal repairs for common LLM issues
			function repair(t) {
				let r = t;
				// Replace smart quotes with straight quotes
				r = r.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
				// Remove trailing commas before } or ]
				r = r.replace(/,(\s*[}\]])/g, '$1');
				return r;
			}
			// 3) Try object first by slicing between first '{' and last '}'
			const s = text.indexOf('{');
			const e = text.lastIndexOf('}');
			if (s !== -1 && e !== -1 && e > s) {
				let candidate = text.slice(s, e + 1);
				try {
					return JSON.parse(candidate);
				} catch (err1) {
					candidate = repair(candidate);
					return JSON.parse(candidate);
				}
			}
			// 4) Try array
			const as = text.indexOf('[');
			const ae = text.lastIndexOf(']');
			if (as !== -1 && ae !== -1 && ae > as) {
				let arrCand = text.slice(as, ae + 1);
				try {
					return JSON.parse(arrCand);
				} catch (err2) {
					arrCand = repair(arrCand);
					return JSON.parse(arrCand);
				}
			}
			// 5) Last attempt: parse the whole text
			try {
				return JSON.parse(text);
			} catch (err3) {
				return JSON.parse(repair(text));
			}
		}

		try {
			return extractJson(recipeText);
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
browser.runtime.onMessage.addListener((message, sender) => {
	const kind = message && (message.type || message.action);

	if (kind === 'pageStateChanged') {
		if (sender.tab && sender.tab.id !== undefined) {
			updateIcon(sender.tab.id, message.isRecipe);
		}
	}
  
	if (kind === 'transformRecipeContent') {
		return transformRecipeWithAI(message.content)
			.then(recipeJson => ({ success: true, recipe: recipeJson }))
			.catch(error => ({ success: false, error: error.message }));
	}
  
	if (kind === 'transformRecipe') {
		// Handle keyboard shortcut - forward to active tab's popup
		return browser.tabs.query({ active: true, currentWindow: true })
			.then(tabs => {
				if (!Array.isArray(tabs) || tabs.length === 0) {
					return { success: false, error: 'No active tab available' };
				}
				const tab = tabs[0];
				return browser.tabs.sendMessage(tab.id, { action: 'extractRecipe' })
					.then(result => {
						if (result && result.success) {
							return transformRecipeWithAI(result.content)
								.then(recipeJson => {
									if (browser.notifications && browser.notifications.create) {
										browser.notifications.create({
											type: 'basic',
											iconUrl: NOTIF_ICON,
											title: 'Recipe Transformed!',
											message: `"${recipeJson.name}" is ready for download`
										});
									}
									return { success: true, recipe: recipeJson };
								})
								.catch(error => {
									if (browser.notifications && browser.notifications.create) {
										browser.notifications.create({
											type: 'basic',
											iconUrl: NOTIF_ICON,
											title: 'Recipe Transform Failed',
											message: error.message
										});
									}
									return { success: false, error: error.message };
								});
						}
					})
					.catch(error => {
						if (browser.notifications && browser.notifications.create) {
							browser.notifications.create({
								type: 'basic',
								iconUrl: NOTIF_ICON,
								title: 'Recipe Transform Failed',
								message: 'No recipe found on this page'
							});
						}
						return { success: false, error: 'No recipe found on this page' };
					});
			});
	}
});

// Handle extension installation
browser.runtime.onInstalled.addListener((details) => {
	if (details.reason === 'install') {
		// Open options page on first install
		if (browser.runtime.openOptionsPage) {
			browser.runtime.openOptionsPage();
		}
    
		// Set initial stats
		browser.storage.sync.set({
			'installDate': new Date().toISOString(),
			'recipeCount': 0
		});
	}
});

// Handle keyboard command
if (browser.commands && browser.commands.onCommand) {
	browser.commands.onCommand.addListener((command) => {
		if (command === 'transform-recipe') {
			browser.runtime.sendMessage({ action: 'transformRecipe' });
		}
	});
}

// will be replaced with content from extension/background-v3.js