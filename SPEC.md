# Recipe Transformer

## Purpose

A lightweight browser-based tool that converts recipe websites into clean, standardized JSON-LD format (schema.org/Recipe) with automatic metric unit conversion for import into Mealie or other recipe management systems.

## Problem Statement

### Why This Exists

1. **Unit Conversion Hell**: Most English recipe sites use imperial measurements (cups, fahrenheit, ounces) which are imprecise and unfamiliar for metric users
2. **Poor Import Quality**: Mealie's built-in scrapers often miss ingredients, instructions, or include ads/popups
3. **Inconsistent Formatting**: Recipe blogs bury the actual recipe under essays, ads, and social media widgets
4. **Lost Context**: Simple scrapers miss nuanced instructions like "room temperature butter" or "divided"

## Solution Overview

### What It Does

- Runs directly in your browser via bookmarklet
- Uses LLM intelligence to understand recipe context
- Converts all measurements to metric (grams, ml, celsius)
- Outputs clean schema.org/Recipe JSON
- Direct integration with Mealie API

### Why This Approach

**Bookmarklet + Client-Side Processing**
- **Zero Infrastructure**: No servers, hosting, or maintenance costs
- **Privacy**: Your recipes never touch our servers
- **Instant Deploy**: Drag link to bookmarks bar = installed
- **Universal**: Works on any browser, any OS, including mobile
- **Simple**: Entire app is one HTML file under 300 lines

## Technical Architecture

### Components

```
[Recipe Website] 
    ↓
[Bookmarklet Activation]
    ↓
[Content Extraction]
    ├── DOM Scraping
    └── Readability.js fallback
    ↓
[LLM Processing]
    ├── Anthropic Claude API
    └── OpenAI GPT API (fallback)
    ↓
[JSON-LD Output]
    ├── Preview/Edit UI
    └── Send to Mealie
```

### How It Works

1. **Bookmarklet Injection**
   - Injects script into current page
   - Extracts page content using Readability.js
   - Opens modal overlay with UI

2. **Content Processing**
   ```javascript
   // Pseudo-flow
   const pageText = extractRecipeContent();
   const recipeJson = await callLLM(pageText, CONVERSION_PROMPT);
   const validated = validateSchema(recipeJson);
   ```

3. **LLM Prompt Strategy**
   - Structured extraction prompt
   - Explicit metric conversion rules
   - JSON schema enforcement
   - Ingredient parsing instructions

4. **Output Options**
   - Copy JSON to clipboard
   - Download as file
   - Direct POST to Mealie API
   - Edit before saving

## Implementation Details

### Key Design Decisions

1. **Client-Side Only**: No backend reduces complexity by 90%
2. **LLM vs Parsing**: LLMs handle edge cases that regex never could
3. **Readability.js**: Mozilla's library already solves content extraction
4. **localStorage for Config**: API keys persist between sessions
5. **Single File Distribution**: Everything in one HTML file for easy sharing

### API Key Security

- Keys stored in browser localStorage
- Never transmitted except to LLM provider
- Optional encryption with user passphrase
- Clear prominent warnings about key storage

### Unit Conversion Rules

**Weights**
- Cups flour → 120g
- Cups sugar → 200g  
- Ounces → grams (×28.35)
- Pounds → grams (×453.6)

**Volumes**
- Cups → ml (×240)
- Tablespoons → ml (×15)
- Teaspoons → ml (×5)
- Fluid ounces → ml (×30)

**Temperature**
- Fahrenheit → Celsius ((F-32)×5/9)

**Special Cases**
- "Stick of butter" → 113g
- "Large egg" → 50g
- "Clove garlic" → unchanged (count)

## Usage Flow

1. **Setup** (one-time)
   - Open `recipe-transformer.html`
   - Enter Anthropic/OpenAI API key
   - Drag bookmarklet to bookmarks bar

2. **Usage**
   - Navigate to any recipe website
   - Click bookmarklet
   - Wait 2-3 seconds for processing
   - Review/edit JSON
   - Send to Mealie or copy

## Development Roadmap

### MVP (2 hours)
- [x] Basic bookmarklet
- [x] LLM integration
- [x] JSON output
- [x] Copy to clipboard

### Phase 2 (Optional)
- [ ] Mealie API integration
- [ ] Edit JSON before saving
- [ ] Multiple LLM provider support
- [ ] Caching layer
- [ ] Batch processing

## Alternative Approaches Considered

| Approach | Pros | Cons | Why Not Chosen |
|----------|------|------|----------------|
| Browser Extension | Full DOM access, better UX | Publishing hassle, platform specific | Too much overhead for simple task |
| CLI Tool | Scriptable, powerful | Terminal required, not user-friendly | Poor UX for non-developers |
| Web Service | No installation, shareable | Hosting costs, API key management | Unnecessary complexity |
| Mobile App | Native performance | App store approval, platform specific | Overkill for occasional use |

## Dependencies

- **Readability.js**: Content extraction (optional, can use basic DOM)
- **Anthropic/OpenAI API**: LLM processing
- **No build tools**: Vanilla JavaScript only
- **No framework**: Keeps it under 300 lines

## Cost Analysis

- **Claude Haiku**: ~$0.001 per recipe
- **GPT-3.5**: ~$0.002 per recipe
- **Monthly cost**: ~$0.10 for 100 recipes
- **Infrastructure**: $0 (client-side)

## Why Not Use Existing Solutions?

1. **Mealie's scraper**: Misses context, no unit conversion
2. **Recipe Filter browser extension**: No LLM intelligence
3. **Copy Me That**: Subscription service, no Mealie integration
4. **Paprika**: Paid app, closed ecosystem

## Success Metrics

- Successful extraction rate > 95%
- Correct unit conversion > 99%
- Time to transform < 5 seconds
- Code complexity < 300 LOC
- Zero maintenance burden