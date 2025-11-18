// Intelligent Extractor - Executes extraction strategies
class IntelligentExtractor {
  constructor() {
    this.contactExtractor = new ContactExtractor();
    this.currentStrategy = null;
    this.extractedData = [];
    this.isRunning = false;
  }

  /**
   * Execute extraction strategy
   */
  async executeStrategy(strategy, options = {}) {
    if (this.isRunning) {
      console.log('Extraction already in progress');
      return { success: false, error: 'Already running' };
    }

    this.isRunning = true;
    this.currentStrategy = strategy;
    this.extractedData = [];

    console.log('Starting extraction strategy:', strategy.goal);

    try {
      for (const step of strategy.steps) {
        console.log(`Executing step: ${step.description}`);

        const result = await this.executeStep(step, strategy);

        if (!result.success) {
          console.warn(`Step failed: ${step.description}`, result.error);
          if (step.required) {
            throw new Error(`Required step failed: ${step.description}`);
          }
        }

        // Wait between steps
        await this.sleep(options.stepDelay || 1000);
      }

      this.isRunning = false;

      return {
        success: true,
        data: this.extractedData,
        count: this.extractedData.length
      };

    } catch (error) {
      this.isRunning = false;
      console.error('Strategy execution failed:', error);
      return {
        success: false,
        error: error.message,
        data: this.extractedData
      };
    }
  }

  /**
   * Execute individual step
   */
  async executeStep(step, strategy) {
    try {
      switch (step.action) {
        case 'detect_applicant_count':
          return await this.detectApplicantCount(step);

        case 'click_view_applicants':
          return await this.clickElement(step);

        case 'scroll_applicant_list':
        case 'scroll_results':
          return await this.scrollPage(step);

        case 'extract_applicant_data':
        case 'extract_profile_cards':
        case 'extract_employee_list':
          return await this.extractListData(step);

        case 'download_resumes':
          return await this.downloadResumes(step);

        case 'expand_post_content':
          return await this.expandContent(step);

        case 'scroll_to_comments':
          return await this.scrollToElement(step);

        case 'load_all_comments':
          return await this.loadAllItems(step);

        case 'extract_comments':
          return await this.extractComments(step);

        case 'extract_contacts_from_comments':
        case 'extract_contacts':
          return await this.extractContactsFromContent(step);

        case 'analyze_comment_relevance':
        case 'assess_engagement_quality':
        case 'assess_relevance':
          return await this.analyzeWithAI(step, strategy);

        case 'click_reactions':
        case 'click_profiles':
          return await this.clickElement(step);

        case 'extract_reactors':
        case 'extract_commenters':
          return await this.extractSocialData(step);

        case 'extract_company_info':
          return await this.extractCompanyInfo(step);

        case 'navigate_to_people':
          return await this.navigateToUrl(step);

        case 'filter_by_role':
          return await this.filterByRole(step);

        case 'scan_content':
          return await this.scanForKeywords(step);

        case 'extract_matched_content':
          return await this.extractMatchedContent(step);

        case 'extract_contact_info':
          return await this.extractContactSection(step);

        case 'analyze_with_ai':
          return await this.analyzeWithAI(step, strategy);

        case 'execute_ai_strategy':
          return await this.executeAIStrategy(step, strategy);

        default:
          console.warn('Unknown action:', step.action);
          return { success: false, error: 'Unknown action' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect applicant count
   */
  async detectApplicantCount(step) {
    const element = document.querySelector(step.selector);
    if (!element) {
      return { success: false, error: 'Applicant count not found' };
    }

    const text = element.textContent || '';
    const count = parseInt(text.match(/\d+/)?.[0] || '0');

    console.log(`Found ${count} applicants`);

    return { success: true, data: { applicantCount: count } };
  }

  /**
   * Click an element
   */
  async clickElement(step) {
    const selectors = Array.isArray(step.selector) ? step.selector : [step.selector];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);

      for (const element of elements) {
        if (element && element.offsetParent !== null) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await this.sleep(500);

          element.click();
          console.log('Clicked:', selector);

          if (step.waitFor) {
            await this.waitForElement(step.waitFor, 5000);
          } else {
            await this.sleep(1000);
          }

          return { success: true };
        }
      }
    }

    return { success: false, error: 'Element not found or not visible' };
  }

  /**
   * Scroll page
   */
  async scrollPage(step) {
    const cycles = step.scrollCycles || 5;

    for (let i = 0; i < cycles; i++) {
      window.scrollBy({
        top: window.innerHeight * 0.9,
        behavior: 'smooth'
      });

      await this.sleep(step.scrollDelay || 1500);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    await this.sleep(1000);

    return { success: true };
  }

  /**
   * Extract list data
   */
  async extractListData(step) {
    const elements = document.querySelectorAll(step.selector);

    if (elements.length === 0) {
      return { success: false, error: 'No elements found' };
    }

    const data = [];

    elements.forEach((element, index) => {
      const item = {};

      // Extract based on dataFields
      step.dataFields.forEach(field => {
        item[field] = this.extractFieldFromElement(element, field);
      });

      // Add metadata
      item._index = index;
      item._timestamp = new Date().toISOString();

      if (Object.keys(item).length > 2) {  // More than just metadata
        data.push(item);
      }
    });

    this.extractedData.push(...data);

    console.log(`Extracted ${data.length} items`);

    return { success: true, data, count: data.length };
  }

  /**
   * Extract field from element
   */
  extractFieldFromElement(element, field) {
    const fieldMap = {
      name: ['.entity-result__title-text', '[data-test-id="profile-name"]', '.actor-name', 'h2', 'h3'],
      headline: ['.entity-result__primary-subtitle', '[data-test-id="profile-headline"]', '.actor-headline'],
      profile_url: ['a[href*="/in/"]', 'a[href*="/company/"]'],
      location: ['.entity-result__secondary-subtitle', '[data-test-id="location"]', '.actor-location'],
      author_name: ['.comments-post-meta__name-text', '.actor-name'],
      author_profile: ['a[href*="/in/"]'],
      comment_text: ['.comments-comment-item__main-content', '.comment-text'],
      email: ['a[href^="mailto:"]', '[data-test-id="email"]'],
      phone: ['a[href^="tel:"]', '[data-test-id="phone"]'],
      company_name: ['.org-top-card-summary__title', '[data-test-id="company-name"]'],
      website: ['a[data-test-id="website"]', 'a[href*="http"]'],
      job_title: ['.jobs-unified-top-card__job-title', '[data-test-id="job-title"]']
    };

    const selectors = fieldMap[field] || [];

    for (const selector of selectors) {
      const el = element.querySelector(selector);

      if (el) {
        if (selector.includes('[href')) {
          return el.getAttribute('href');
        }

        return el.textContent?.trim() || el.innerText?.trim() || '';
      }
    }

    // Try to extract from full text
    const fullText = element.textContent || element.innerText || '';

    if (field === 'email') {
      const emails = this.contactExtractor.extractEmails(fullText);
      return emails.length > 0 ? emails[0] : '';
    }

    if (field === 'phone') {
      const phones = this.contactExtractor.extractPhones(fullText);
      return phones.length > 0 ? phones[0] : '';
    }

    return '';
  }

  /**
   * Download resumes
   */
  async downloadResumes(step) {
    const links = document.querySelectorAll(step.selector);
    let downloaded = 0;

    for (const link of links) {
      if (link.href) {
        // Trigger download
        const a = document.createElement('a');
        a.href = link.href;
        a.download = link.getAttribute('download') || `resume_${Date.now()}.pdf`;
        a.click();

        downloaded++;
        await this.sleep(1000);
      }
    }

    console.log(`Downloaded ${downloaded} resumes`);

    return { success: true, count: downloaded };
  }

  /**
   * Expand content
   */
  async expandContent(step) {
    const buttons = document.querySelectorAll(step.selector);

    for (const button of buttons) {
      if (button && button.offsetParent !== null) {
        const text = button.textContent?.toLowerCase() || '';

        if (text.includes('more') && !text.includes('less')) {
          button.click();
          await this.sleep(300);
        }
      }
    }

    return { success: true };
  }

  /**
   * Scroll to element
   */
  async scrollToElement(step) {
    const element = document.querySelector(step.selector);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      await this.sleep(1000);
      return { success: true };
    }

    return { success: false, error: 'Element not found' };
  }

  /**
   * Load all items (e.g., comments)
   */
  async loadAllItems(step) {
    let clicked = 0;
    const maxAttempts = step.maxAttempts || 20;

    for (let i = 0; i < maxAttempts; i++) {
      const button = document.querySelector(step.selector);

      if (!button || button.offsetParent === null) {
        break;
      }

      button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(500);

      button.click();
      clicked++;

      await this.sleep(1500);
    }

    console.log(`Loaded more items ${clicked} times`);

    return { success: true, count: clicked };
  }

  /**
   * Extract comments
   */
  async extractComments(step) {
    const comments = document.querySelectorAll(step.selector);
    const data = [];

    comments.forEach((comment, index) => {
      const item = {
        author_name: '',
        author_profile: '',
        comment_text: '',
        timestamp: '',
        emails: [],
        phones: []
      };

      // Extract author
      const authorEl = comment.querySelector('.comments-post-meta__name-text, .actor-name');
      if (authorEl) {
        item.author_name = authorEl.textContent?.trim() || '';
      }

      // Extract profile link
      const profileLink = comment.querySelector('a[href*="/in/"]');
      if (profileLink) {
        item.author_profile = profileLink.href;
      }

      // Extract comment text
      const contentEl = comment.querySelector('.comments-comment-item__main-content, .comment-text');
      if (contentEl) {
        item.comment_text = contentEl.textContent?.trim() || '';
      }

      // Extract contacts
      const fullText = comment.textContent || '';
      item.emails = this.contactExtractor.extractEmails(fullText);
      item.phones = this.contactExtractor.extractPhones(fullText);

      item._index = index;
      item._timestamp = new Date().toISOString();

      data.push(item);
    });

    this.extractedData.push(...data);

    console.log(`Extracted ${data.length} comments`);

    return { success: true, data, count: data.length };
  }

  /**
   * Extract contacts from content
   */
  async extractContactsFromContent(step) {
    const text = document.body.textContent || '';
    const contacts = this.contactExtractor.extractAll(text);

    console.log(`Found ${contacts.emails.length} emails, ${contacts.phones.length} phones`);

    return {
      success: true,
      data: { emails: contacts.emails, phones: contacts.phones }
    };
  }

  /**
   * Analyze with AI
   */
  async analyzeWithAI(step, strategy) {
    // Send to background for AI analysis
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'AI_ANALYZE_EXTRACTION',
        data: this.extractedData,
        prompt: strategy.aiPrompt,
        task: step.aiTask || 'relevance_assessment'
      }, (response) => {
        if (response && response.success) {
          // Filter data based on AI response
          this.extractedData = this.extractedData.map((item, index) => {
            const aiResult = response.results?.[index];

            if (aiResult) {
              item._aiRelevant = aiResult.relevant;
              item._aiPriority = aiResult.priority;
              item._aiReason = aiResult.reason;
            }

            return item;
          });

          resolve({ success: true, analyzed: response.results?.length || 0 });
        } else {
          resolve({ success: false, error: 'AI analysis failed' });
        }
      });
    });
  }

  /**
   * Extract social data (reactors, commenters)
   */
  async extractSocialData(step) {
    return await this.extractListData(step);
  }

  /**
   * Extract company info
   */
  async extractCompanyInfo(step) {
    const data = {};

    step.dataFields.forEach(field => {
      const value = this.extractFieldFromElement(document.body, field);
      if (value) {
        data[field] = value;
      }
    });

    this.extractedData.push(data);

    return { success: true, data };
  }

  /**
   * Navigate to URL
   */
  async navigateToUrl(step) {
    const currentUrl = window.location.href;
    const newUrl = currentUrl.replace(/\/$/, '') + step.url;

    window.location.href = newUrl;

    return { success: true };
  }

  /**
   * Filter by role
   */
  async filterByRole(step) {
    // This would apply filters on the page
    // Implementation depends on LinkedIn's current UI
    return { success: true };
  }

  /**
   * Scan for keywords
   */
  async scanForKeywords(step) {
    // Use existing keyword matcher
    // Implementation in content.js integration
    return { success: true };
  }

  /**
   * Extract matched content
   */
  async extractMatchedContent(step) {
    // Use existing extraction logic
    return { success: true };
  }

  /**
   * Extract contact section
   */
  async extractContactSection(step) {
    const contactSection = document.querySelector(step.selector);

    if (!contactSection) {
      return { success: false, error: 'Contact section not found' };
    }

    const text = contactSection.textContent || '';
    const contacts = this.contactExtractor.extractAll(text);

    const data = {
      emails: contacts.emails,
      phones: contacts.phones,
      _timestamp: new Date().toISOString()
    };

    // Also look for links
    const emailLinks = contactSection.querySelectorAll('a[href^="mailto:"]');
    emailLinks.forEach(link => {
      const email = link.href.replace('mailto:', '');
      if (!data.emails.includes(email)) {
        data.emails.push(email);
      }
    });

    const phoneLinks = contactSection.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
      const phone = link.href.replace('tel:', '');
      if (!data.phones.includes(phone)) {
        data.phones.push(phone);
      }
    });

    this.extractedData.push(data);

    return { success: true, data };
  }

  /**
   * Execute AI-generated strategy
   */
  async executeAIStrategy(step, strategy) {
    // For custom goals, let AI determine the best approach
    return { success: true };
  }

  /**
   * Utility functions
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitForElement(selector, timeout = 5000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const element = document.querySelector(selector);

      if (element) {
        return element;
      }

      await this.sleep(200);
    }

    return null;
  }

  /**
   * Get extracted data
   */
  getExtractedData() {
    return this.extractedData;
  }

  /**
   * Clear extracted data
   */
  clearData() {
    this.extractedData = [];
  }

  /**
   * Stop extraction
   */
  stop() {
    this.isRunning = false;
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.IntelligentExtractor = IntelligentExtractor;
}
