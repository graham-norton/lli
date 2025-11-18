/**
 * AI-Driven Web Scraper
 * Uses AI to analyze page HTML and generate extraction strategies dynamically
 */

class AIScraper {
  constructor() {
    this.maxHtmlSize = 50000; // Max chars to send to AI (to control costs)
    this.lastAnalysis = null;
    this.lastStrategy = null;
  }

  /**
   * Capture and clean HTML from the current page
   * @returns {Object} Cleaned HTML and metadata
   */
  capturePageContext() {
    const html = document.documentElement.outerHTML;
    const url = window.location.href;
    const title = document.title;

    // Get visible text content for context
    const visibleText = document.body.innerText.slice(0, 2000);

    // Clean and minimize HTML
    const cleanedHtml = this.cleanHtml(html);

    return {
      url,
      title,
      html: cleanedHtml,
      visibleText,
      htmlSize: cleanedHtml.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clean and minimize HTML for AI processing
   * @param {string} html - Raw HTML
   * @returns {string} Cleaned HTML
   */
  cleanHtml(html) {
    let cleaned = html;

    // Remove script tags and content
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove style tags and content
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove comments
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

    // Remove inline styles (but keep class and id attributes)
    cleaned = cleaned.replace(/\s+style="[^"]*"/gi, '');

    // Collapse whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Remove data attributes (usually noise)
    cleaned = cleaned.replace(/\s+data-[a-z-]+="[^"]*"/gi, '');

    // If still too large, take intelligent slices
    if (cleaned.length > this.maxHtmlSize) {
      cleaned = this.intelligentTrim(cleaned);
    }

    return cleaned;
  }

  /**
   * Intelligently trim HTML to keep relevant parts
   * @param {string} html - HTML to trim
   * @returns {string} Trimmed HTML
   */
  intelligentTrim(html) {
    // Keep the first part (header, navigation)
    const headerEnd = Math.min(5000, html.length);
    const header = html.slice(0, headerEnd);

    // Keep the main content area (body)
    const bodyStart = html.indexOf('<main') > 0 ? html.indexOf('<main') : html.indexOf('<body');
    const bodyEnd = Math.min(bodyStart + 40000, html.length);
    const body = bodyStart > 0 ? html.slice(bodyStart, bodyEnd) : html.slice(headerEnd, headerEnd + 40000);

    return header + '\n...[trimmed]...\n' + body;
  }

  /**
   * Generate extraction strategy using AI
   * @param {string} userGoal - What the user wants to extract
   * @param {Object} pageContext - Page HTML and metadata
   * @returns {Promise<Object>} AI-generated extraction strategy
   */
  async generateExtractionStrategy(userGoal, pageContext) {
    console.log('🤖 Asking AI to analyze page and generate extraction strategy...');
    console.log(`Goal: ${userGoal}`);
    console.log(`HTML size: ${pageContext.htmlSize} chars`);

    const prompt = this.buildAnalysisPrompt(userGoal, pageContext);

    try {
      // Send to background script for AI API call
      const response = await chrome.runtime.sendMessage({
        type: 'AI_ANALYZE_HTML',
        prompt: prompt,
        userGoal: userGoal,
        pageUrl: pageContext.url
      });

      if (!response || !response.success) {
        throw new Error(response?.error || 'AI analysis failed');
      }

      const strategy = this.parseAIResponse(response.data);
      this.lastStrategy = strategy;

      console.log('✅ AI generated extraction strategy:', strategy);
      return strategy;

    } catch (error) {
      console.error('❌ Error generating extraction strategy:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for AI to analyze HTML
   * @param {string} userGoal - User's extraction goal
   * @param {Object} pageContext - Page context
   * @returns {string} Prompt for AI
   */
  buildAnalysisPrompt(userGoal, pageContext) {
    return `You are a web scraping expert. Analyze this LinkedIn page and generate an extraction strategy.

**User's Goal:**
${userGoal}

**Page URL:**
${pageContext.url}

**Page Title:**
${pageContext.title}

**Visible Content Preview:**
${pageContext.visibleText}

**HTML Structure:**
\`\`\`html
${pageContext.html}
\`\`\`

**Your Task:**
Analyze the HTML and determine:
1. What type of LinkedIn page this is (job listing, feed, profile, search results, etc.)
2. What data can be extracted to fulfill the user's goal
3. Specific CSS selectors or XPath to target those elements
4. Step-by-step extraction instructions

**Return your response as a JSON object with this exact structure:**
\`\`\`json
{
  "pageType": "job_listing | feed | profile | search_results | post | company | other",
  "confidence": 0.95,
  "dataAvailable": [
    {
      "field": "email",
      "selector": ".contact-info email",
      "extractionMethod": "textContent | attribute | innerHTML",
      "attributeName": "href",
      "found": true,
      "estimatedCount": 5
    }
  ],
  "extractionSteps": [
    {
      "step": 1,
      "action": "click | scroll | wait | extract",
      "description": "Click 'See more' button to expand content",
      "selector": ".see-more-button",
      "required": false,
      "waitAfterMs": 1000
    }
  ],
  "recommendations": "Additional suggestions or warnings",
  "limitations": "What cannot be extracted or requires user action"
}
\`\`\`

**Important:**
- Be precise with CSS selectors (inspect the actual HTML provided)
- Consider dynamic content loading
- Handle multiple items (lists, search results)
- Account for LinkedIn's anti-scraping measures
- Suggest scroll/click actions if content is hidden
- Be realistic about what can be extracted

Return ONLY valid JSON, no other text.`;
  }

  /**
   * Parse AI response and validate strategy
   * @param {string} aiResponse - Raw AI response
   * @returns {Object} Parsed extraction strategy
   */
  parseAIResponse(aiResponse) {
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      let jsonStr = aiResponse;

      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else {
        // Try to find JSON object in response
        const objMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (objMatch) {
          jsonStr = objMatch[0];
        }
      }

      const strategy = JSON.parse(jsonStr);

      // Validate required fields
      if (!strategy.pageType || !strategy.dataAvailable || !strategy.extractionSteps) {
        throw new Error('Invalid strategy format: missing required fields');
      }

      return strategy;

    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.log('Raw response:', aiResponse);
      throw new Error(`Failed to parse AI strategy: ${error.message}`);
    }
  }

  /**
   * Execute AI-generated extraction strategy
   * @param {Object} strategy - Extraction strategy from AI
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Extracted data
   */
  async executeStrategy(strategy, options = {}) {
    console.log('🚀 Executing AI-generated extraction strategy...');

    const extractedData = [];
    const maxItems = options.maxItems || 100;
    const stepDelay = options.stepDelay || 1000;

    try {
      // Execute preparation steps
      for (const step of strategy.extractionSteps) {
        console.log(`Step ${step.step}: ${step.description}`);

        const result = await this.executeStep(step);

        if (!result.success && step.required) {
          console.warn(`⚠️ Required step failed: ${step.description}`);
          break;
        }

        if (step.waitAfterMs) {
          await this.sleep(step.waitAfterMs);
        } else {
          await this.sleep(stepDelay);
        }
      }

      // Extract data using selectors
      for (const dataField of strategy.dataAvailable) {
        if (!dataField.found || !dataField.selector) {
          continue;
        }

        const elements = document.querySelectorAll(dataField.selector);
        console.log(`Found ${elements.length} elements for: ${dataField.field}`);

        elements.forEach((el, index) => {
          if (index >= maxItems) return;

          let value = null;

          switch (dataField.extractionMethod) {
            case 'textContent':
              value = el.textContent.trim();
              break;
            case 'attribute':
              value = el.getAttribute(dataField.attributeName);
              break;
            case 'innerHTML':
              value = el.innerHTML;
              break;
            default:
              value = el.textContent.trim();
          }

          if (value) {
            // Find or create data object for this item
            let dataObj = extractedData[index] || {
              id: `item-${index}`,
              timestamp: new Date().toISOString(),
              sourceUrl: window.location.href
            };

            dataObj[dataField.field] = value;
            extractedData[index] = dataObj;
          }
        });
      }

      console.log(`✅ Extracted ${extractedData.length} items`);
      return {
        success: true,
        data: extractedData,
        count: extractedData.length,
        strategy: strategy
      };

    } catch (error) {
      console.error('❌ Error executing strategy:', error);
      return {
        success: false,
        error: error.message,
        data: extractedData
      };
    }
  }

  /**
   * Execute a single extraction step
   * @param {Object} step - Step to execute
   * @returns {Promise<Object>} Step result
   */
  async executeStep(step) {
    try {
      switch (step.action) {
        case 'click':
          return await this.clickElement(step.selector);

        case 'scroll':
          return await this.scrollToElement(step.selector);

        case 'wait':
          await this.sleep(step.waitAfterMs || 1000);
          return { success: true };

        case 'extract':
          // Extraction is handled separately
          return { success: true };

        default:
          console.warn(`Unknown action: ${step.action}`);
          return { success: false };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Click an element
   * @param {string} selector - CSS selector
   * @returns {Promise<Object>} Click result
   */
  async clickElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      return { success: false, error: 'Element not found' };
    }

    if (element.offsetParent === null) {
      return { success: false, error: 'Element not visible' };
    }

    element.click();
    return { success: true };
  }

  /**
   * Scroll to element
   * @param {string} selector - CSS selector
   * @returns {Promise<Object>} Scroll result
   */
  async scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      return { success: false, error: 'Element not found' };
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return { success: true };
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.AIScraper = AIScraper;
}
