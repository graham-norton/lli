// LinkedIn Lead Finder - Content Script
class LinkedInScanner {
  constructor() {
    this.keywords = [];
    this.settings = {};
    this.scannedPosts = new Set();
    this.leads = [];
    this.observer = null;
    this.rescanInterval = null;
    this.autoSearchTimer = null;
    this.autoSearchStateKey = 'llfAutoSearchState';
    this.processingAutoSearch = false;
    this.extractor = new ContactExtractor();
    this.matcher = null;

    // Intelligent mode components
    this.pageAnalyzer = new LinkedInPageAnalyzer();
    this.goalEngine = new GoalEngine();
    this.intelligentExtractor = new IntelligentExtractor();
    this.intelligentMode = false;
    this.currentGoal = null;
    this.currentPageAnalysis = null;

    this.stats = {
      totalLeads: 0,
      emailsFound: 0,
      phonesFound: 0
    };

    this.init();
  }

  getDefaultSettings() {
    return {
      caseSensitive: false,
      wholeWord: false,
      autoSync: true,
      scanMode: 'auto',
      enableNotifications: true,
      highlightPosts: true,
      scanComments: false,
      scanIntervalMs: 15000,
      autoSearchEnabled: false,
      autoSearchDelay: 20000,
      autoScrollEnabled: true,
      autoScrollCycles: 6,
      autoScrollDelay: 1500,
      aiRelevanceEnabled: false,
      companyProfile: '',
      openRouterModel: 'openrouter/openai/gpt-4o-mini',
      // Intelligent mode settings
      intelligentMode: false,
      currentGoalId: null,
      autopilotEnabled: false
    };
  }

  async init() {
    console.log('LinkedIn Lead Finder initialized');

    // Load configuration
    await this.loadConfig();
    this.setupStorageListeners();

    // Initialize matcher
    this.matcher = new KeywordMatcher(this.keywords, {
      caseSensitive: this.settings.caseSensitive,
      wholeWord: this.settings.wholeWord
    });

    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });
  }

  async loadConfig() {
    try {
      const data = await chrome.storage.sync.get(['keywords', 'settings']);
      const defaults = this.getDefaultSettings();
      this.keywords = data.keywords || [];
      this.settings = { ...defaults, ...(data.settings || {}) };

      console.log('Loaded config:', { keywords: this.keywords, settings: this.settings });
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }

  start() {
    // Always set up observers so scans can start once keywords arrive
    this.observeNewPosts();

    // Show stats counter if enabled
    if (this.settings.highlightPosts) {
      this.showStatsCounter();
    }

    // Attempt initial scan (will log if keywords missing/manual mode)
    this.runScanIfReady();
    this.startPeriodicScan();
    this.ensureAutoSearchMonitor();
  }

  async runScanIfReady() {
    if (!this.keywords || this.keywords.length === 0) {
      console.log('No keywords configured. Waiting for keywords from popup.');
      return;
    }

    if (this.settings.scanMode === 'manual' && !this.settings.autoSearchEnabled) {
      console.log('Manual scan mode enabled. Automatic scanning skipped.');
      return;
    }

    try {
      console.log('Scanning LinkedIn feed for leads...');
      await this.scanExistingPosts();
    } catch (error) {
      console.error('Error during scan:', error);
    }
  }

  startPeriodicScan() {
    if (this.rescanInterval) {
      clearInterval(this.rescanInterval);
    }

    const interval = (this.settings && this.settings.scanIntervalMs) || 15000;

    this.rescanInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.runScanIfReady();
      }
    }, interval);
  }

  setupStorageListeners() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'sync') return;

      if (changes.keywords) {
        this.keywords = changes.keywords.newValue || [];
        if (this.matcher) {
          this.matcher.setKeywords(this.keywords);
        }
        this.scannedPosts.clear();
        this.runScanIfReady();
        this.ensureAutoSearchMonitor();
      }

      if (changes.settings) {
        this.settings = {
          ...this.settings,
          ...(changes.settings.newValue || {})
        };
        if (this.matcher) {
          this.matcher.setOptions({
            caseSensitive: this.settings.caseSensitive,
            wholeWord: this.settings.wholeWord
          });
        }
        this.runScanIfReady();
        this.ensureAutoSearchMonitor();
      }
    });
  }

  async scanExistingPosts() {
    const posts = this.findPosts();
    console.log(`Found ${posts.length} posts to scan`);

    for (const post of posts) {
      await this.scanPost(post);
    }
  }

  findPosts() {
    return this.collectPostElements(document);
  }

  async scanPost(postElement) {
    try {
      // Get unique identifier
      const postId = this.getPostId(postElement);
      if (!postId || this.scannedPosts.has(postId)) {
        return;
      }

      // Expand truncated post text before extraction
      await this.expandPostContent(postElement);

      // Extract post content
      const postData = this.extractPostData(postElement);
      if (!postData || !postData.content) {
        return;
      }

      // Check for keyword matches
      const matchResult = this.matcher.match(postData.content);

      if (matchResult.matched) {
        console.log('Match found!', { keywords: matchResult.keywords, post: postData });

        // Extract contact information
        const contacts = this.extractor.extractAll(postData.content);

        // Create lead object
        const lead = {
          id: postId,
          timestamp: new Date().toISOString(),
          postUrl: postData.url,
          authorName: postData.author,
          authorProfile: postData.authorProfile,
          keywordMatched: matchResult.keywords,
          postContent: postData.content,
          emails: contacts.emails,
          phones: contacts.phones,
          exported: false
        };

        // Evaluate with AI if enabled
        const aiDecision = await this.evaluateLeadWithAI(lead);
        if (!aiDecision.relevant) {
          console.log('Lead filtered by AI relevance check:', aiDecision.reason || 'No reason provided');
          this.scannedPosts.add(postId);
          return;
        }

        lead.aiDecision = aiDecision;

        // Save lead
        this.saveLead(lead);
        // Visual feedback
        if (this.settings.highlightPosts) {
          this.highlightPost(postElement, matchResult.keywords, contacts);
        }

        // Notification
        if (this.settings.enableNotifications && (contacts.emails.length > 0 || contacts.phones.length > 0)) {
          this.showNotification('New Lead Found!', `Found ${contacts.emails.length} email(s) and ${contacts.phones.length} phone(s)`);
        }

        // Update stats
        this.updateStats(contacts);
      }

      // Mark as scanned
      this.scannedPosts.add(postId);

    } catch (error) {
      console.error('Error scanning post:', error);
    }
  }

  getPostId(postElement) {
    // Try to get unique ID from data attributes
    const urn = postElement.getAttribute('data-urn') ||
                postElement.getAttribute('data-id') ||
                postElement.getAttribute('id');

    if (urn) return urn;

    // Fallback: generate ID from content
    const content = postElement.innerText || '';
    return content.substring(0, 100).replace(/\s/g, '');
  }

  extractPostData(postElement) {
    try {
      // Extract content
      const contentSelectors = [
        '.feed-shared-update-v2__description',
        '.feed-shared-text',
        '[data-test-id="main-feed-activity-card__commentary"]',
        '.update-components-text'
      ];

      let contentElement = null;
      for (const selector of contentSelectors) {
        contentElement = postElement.querySelector(selector);
        if (contentElement) break;
      }

      const content = contentElement ? (contentElement.innerText || contentElement.textContent) : postElement.innerText;

      // Extract author
      const authorSelectors = [
        '.feed-shared-actor__name',
        '[data-test-id="main-feed-activity-card__actor"]',
        '.update-components-actor__name'
      ];

      let authorElement = null;
      for (const selector of authorSelectors) {
        authorElement = postElement.querySelector(selector);
        if (authorElement) break;
      }

      const author = authorElement ? (authorElement.innerText || authorElement.textContent) : 'Unknown';

      // Extract post URL
      const linkElement = postElement.querySelector('a[href*="/feed/update/"]') ||
                          postElement.querySelector('a[data-test-id="main-feed-activity-card__link"]');

      let postUrl = window.location.href;
      if (linkElement) {
        const href = linkElement.getAttribute('href');
        if (href) {
          postUrl = href.startsWith('http') ? href : `https://www.linkedin.com${href}`;
        }
      }

      // Extract author profile
      const profileLink = postElement.querySelector('a[href*="/in/"]');
      let authorProfile = '';
      if (profileLink) {
        const href = profileLink.getAttribute('href');
        if (href) {
          authorProfile = href.startsWith('http') ? href : `https://www.linkedin.com${href}`;
        }
      }

      return {
        content: content ? content.trim() : '',
        author: author ? author.trim() : 'Unknown',
        url: postUrl,
        authorProfile
      };

    } catch (error) {
      console.error('Error extracting post data:', error);
      return null;
    }
  }

  async expandPostContent(postElement) {
    try {
      const selectors = [
        'button.feed-shared-inline-show-more-text__see-more-less-toggle',
        'button.inline-show-more-text__button',
        'button[aria-label*="see more" i]',
        'button[aria-label*="show more" i]',
        '.feed-shared-inline-show-more-text button',
        '.inline-show-more-text button'
      ];

      const buttons = new Set();
      selectors.forEach(selector => {
        postElement.querySelectorAll(selector).forEach(btn => {
          if (btn && btn.offsetParent !== null) {
            buttons.add(btn);
          }
        });
      });

      if (buttons.size === 0) {
        return;
      }

      for (const button of buttons) {
        const label = (button.textContent || button.getAttribute('aria-label') || '').toLowerCase();
        if (label.includes('more') && !label.includes('less')) {
          button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          button.click();
          button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
          await this.sleep(200);
        }
      }
    } catch (error) {
      console.warn('Failed to expand post content:', error);
    }
  }

  highlightPost(postElement, keywords, contacts) {
    // Add highlight class
    postElement.classList.add('llf-matched-post');

    // Add match badge
    const badge = document.createElement('div');
    badge.className = 'llf-match-badge';
    badge.textContent = `Match: ${keywords.join(', ')}`;
    badge.title = `Matched keywords: ${keywords.join(', ')}`;

    // Position badge
    postElement.style.position = 'relative';
    postElement.appendChild(badge);

    // Add contact badge if contacts found
    if (contacts.emails.length > 0 || contacts.phones.length > 0) {
      const contactBadge = document.createElement('div');
      contactBadge.className = 'llf-contact-badge';
      contactBadge.textContent = `📧 ${contacts.emails.length} | 📱 ${contacts.phones.length}`;
      contactBadge.title = `Emails: ${contacts.emails.join(', ')}\nPhones: ${contacts.phones.join(', ')}`;
      postElement.appendChild(contactBadge);
    }
  }

  async saveLead(lead) {
    try {
      // Add to local array
      this.leads.push(lead);

      // Save to storage
      const { leads = [] } = await chrome.storage.local.get(['leads']);
      leads.push(lead);
      await chrome.storage.local.set({ leads });

      // Send to background for potential auto-export
      chrome.runtime.sendMessage({
        type: 'NEW_LEAD',
        lead
      });

      console.log('Lead saved:', lead);
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  }

  evaluateLeadWithAI(lead) {
    if (!this.settings.aiRelevanceEnabled) {
      return Promise.resolve({
        relevant: true,
        reason: 'AI filter disabled'
      });
    }

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'ASSESS_LEAD_RELEVANCE',
        lead,
        profile: this.settings.companyProfile || '',
        model: this.settings.openRouterModel
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('AI relevance check failed:', chrome.runtime.lastError.message);
          resolve({
            relevant: true,
            reason: 'AI unreachable, defaulting to true'
          });
          return;
        }

        if (!response) {
          resolve({
            relevant: true,
            reason: 'No AI response, defaulting to true'
          });
          return;
        }

        resolve({
          relevant: response.relevant !== false,
          reason: response.reason || 'Approved by AI',
          score: response.score
        });
      });
    });
  }

  updateStats(contacts) {
    this.stats.totalLeads++;
    this.stats.emailsFound += contacts.emails.length;
    this.stats.phonesFound += contacts.phones.length;

    // Update stats counter display
    this.refreshStatsCounter();

    // Save stats
    chrome.storage.local.set({ stats: this.stats });

    // Notify background
    chrome.runtime.sendMessage({
      type: 'STATS_UPDATED',
      stats: this.stats
    });
  }

  observeNewPosts() {
    // Create mutation observer to watch for new posts
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              const possiblePost = this.normalizePostElement(node);
              if (possiblePost && this.isPost(possiblePost)) {
                this.scanPost(possiblePost).catch((error) => console.error('Error scanning new post:', error));
              }

              // Check children
              const posts = this.findPostsInElement(node);
              posts.forEach(post => {
                this.scanPost(post).catch((error) => console.error('Error scanning nested post:', error));
              });
            }
            });
          }
        }
      });

    // Start observing
    const feedContainer = document.querySelector('.scaffold-layout__main') ||
                          document.querySelector('main') ||
                          document.body;

    if (feedContainer) {
      this.observer.observe(feedContainer, {
        childList: true,
        subtree: true
      });

      console.log('Observing for new posts...');
    }
  }

  isPost(element) {
    if (!element || element.nodeType !== 1) return false;

    const dataAttr = element.getAttribute('data-id') || element.getAttribute('data-urn');
    const hasActivityUrn = dataAttr && dataAttr.includes('urn:li:activity');
    const hasPostClass = element.classList && (
      element.classList.contains('feed-shared-update-v2') ||
      element.classList.contains('feed-update')
    );
    const hasTestId = element.dataset && element.dataset.testId === 'main-feed-activity-card';

    return Boolean(
      hasActivityUrn ||
      hasPostClass ||
      hasTestId ||
      element.tagName === 'ARTICLE'
    );
  }

  findPostsInElement(element) {
    return this.collectPostElements(element);
  }

  collectPostElements(root) {
    if (!root || !root.querySelectorAll) return [];

    const selectors = [
      'article[data-id^="urn:li:activity"]',
      'article[data-urn^="urn:li:activity"]',
      'div[data-id^="urn:li:activity"]',
      'div[data-urn^="urn:li:activity"]',
      '.feed-shared-update-v2',
      '.feed-update',
      'div[data-test-id="main-feed-activity-card"]'
    ];

    const posts = new Set();

    selectors.forEach(selector => {
      root.querySelectorAll(selector).forEach(element => {
        const normalized = this.normalizePostElement(element);
        if (normalized && this.isPost(normalized)) {
          posts.add(normalized);
        }
      });
    });

    return Array.from(posts);
  }

  normalizePostElement(element) {
    if (!element || element.nodeType !== 1) return null;

    return element.closest('article[data-id^="urn:li:activity"]') ||
           element.closest('article[data-urn^="urn:li:activity"]') ||
           element.closest('div[data-id^="urn:li:activity"]') ||
           element.closest('div[data-urn^="urn:li:activity"]') ||
           element.closest('article') ||
           element;
  }

  async ensureAutoSearchMonitor(forceStop = false) {
    if (forceStop || !this.settings.autoSearchEnabled || !this.keywords || this.keywords.length === 0) {
      await this.stopAutoSearch();
      return;
    }

    if (this.processingAutoSearch) {
      return;
    }

    if (!this.autoSearchTimer) {
      this.processAutoSearchState().catch((error) => console.error('Auto search error:', error));
    }
  }

  async stopAutoSearch() {
    if (this.autoSearchTimer) {
      clearTimeout(this.autoSearchTimer);
      this.autoSearchTimer = null;
    }
    this.processingAutoSearch = false;
    await chrome.storage.local.remove([this.autoSearchStateKey]);
  }

  async processAutoSearchState() {
    if (!this.settings.autoSearchEnabled || !this.keywords || this.keywords.length === 0) {
      await this.stopAutoSearch();
      return;
    }

    this.processingAutoSearch = true;
    try {
      const stored = await chrome.storage.local.get([this.autoSearchStateKey]);
      let state = stored[this.autoSearchStateKey];

      if (!state || !state.running) {
        state = {
          running: true,
          keywordIndex: 0,
          shouldNavigate: true
        };
      }

      if (state.keywordIndex >= this.keywords.length) {
        state.keywordIndex = 0;
      }

      const keyword = this.keywords[state.keywordIndex % this.keywords.length];
      if (!keyword) {
        await this.stopAutoSearch();
        this.processingAutoSearch = false;
        return;
      }

      if (state.shouldNavigate) {
        const nextState = {
          ...state,
          running: true,
          shouldNavigate: false,
          currentKeyword: keyword
        };
        await chrome.storage.local.set({ [this.autoSearchStateKey]: nextState });
        this.processingAutoSearch = false;
        this.navigateToKeyword(keyword);
        return;
      }

      await this.autoScrollAndScan();

      const nextIndex = (state.keywordIndex + 1) % this.keywords.length;
      const continueRunning = this.settings.autoSearchEnabled && this.keywords.length > 0;
      const nextState = {
        running: continueRunning,
        keywordIndex: nextIndex,
        shouldNavigate: continueRunning,
        currentKeyword: continueRunning ? this.keywords[nextIndex % this.keywords.length] : null
      };

      await chrome.storage.local.set({ [this.autoSearchStateKey]: nextState });
      this.processingAutoSearch = false;

      if (continueRunning) {
        const delay = this.settings.autoSearchDelay || 20000;
        this.autoSearchTimer = setTimeout(() => {
          this.processAutoSearchState().catch((error) => console.error('Auto search loop error:', error));
        }, delay);
      } else {
        await this.stopAutoSearch();
      }
    } catch (error) {
      console.error('Failed to process auto search state:', error);
      this.processingAutoSearch = false;
    }
  }

  async autoScrollAndScan() {
    const cycles = Math.max(1, this.settings.autoScrollCycles || 1);

    for (let i = 0; i < cycles; i++) {
      await this.runScanIfReady();

      if (this.settings.autoScrollEnabled) {
        window.scrollBy({
          top: window.innerHeight * 0.9,
          behavior: 'smooth'
        });
        await this.sleep(this.settings.autoScrollDelay || 1500);
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async navigateToKeyword(keyword) {
    console.log(`Auto-search navigating to: ${keyword}`);
    const selectors = this.getSearchInputSelectors();
    const searchInput = await this.waitForElement(selectors, 4000);

    if (searchInput) {
      searchInput.focus();
      searchInput.value = keyword;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));

      const dispatchKey = (eventType) => {
        const event = new KeyboardEvent(eventType, {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true
        });
        searchInput.dispatchEvent(event);
      };

      dispatchKey('keydown');
      dispatchKey('keypress');
      dispatchKey('keyup');

      setTimeout(() => {
        if (!this.isOnSearchResultsPage()) {
          window.location.href = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(keyword)}&origin=GLOBAL_SEARCH_HEADER`;
        }
      }, 1500);
      return;
    }

    window.location.href = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(keyword)}&origin=GLOBAL_SEARCH_HEADER`;
  }

  getSearchInputSelectors() {
    return [
      'input[placeholder="Search"]',
      'input[aria-label="Search"]',
      '.search-global-typeahead__input',
      'input.search-global-typeahead__input'
    ];
  }

  waitForElement(selectors, timeout = 4000) {
    return new Promise((resolve) => {
      const check = () => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            resolve(element);
            return true;
          }
        }
        return false;
      };

      if (check()) return;

      const interval = setInterval(() => {
        if (check()) {
          clearInterval(interval);
          clearTimeout(timer);
        }
      }, 200);

      const timer = setTimeout(() => {
        clearInterval(interval);
        resolve(null);
      }, timeout);
    });
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  isOnSearchResultsPage() {
    return window.location.pathname.includes('/search/results');
  }

  showNotification(title, message) {
    const notification = document.createElement('div');
    notification.className = 'llf-notification success';
    notification.innerHTML = `
      <div class="llf-notification-title">${title}</div>
      <div class="llf-notification-message">${message}</div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  showStatsCounter() {
    if (document.getElementById('llf-stats-counter')) return;

    const counter = document.createElement('div');
    counter.id = 'llf-stats-counter';
    counter.className = 'llf-stats-counter';
    counter.innerHTML = `
      <div class="llf-stats-content">
        <div class="llf-stats-title">Lead Finder</div>
        <div class="llf-stat-row">
          <span>Leads:</span>
          <span class="llf-stat-value" id="llf-stat-leads">0</span>
        </div>
        <div class="llf-stat-row">
          <span>Emails:</span>
          <span class="llf-stat-value" id="llf-stat-emails">0</span>
        </div>
        <div class="llf-stat-row">
          <span>Phones:</span>
          <span class="llf-stat-value" id="llf-stat-phones">0</span>
        </div>
      </div>
    `;

    document.body.appendChild(counter);
  }

  refreshStatsCounter() {
    const leadsEl = document.getElementById('llf-stat-leads');
    const emailsEl = document.getElementById('llf-stat-emails');
    const phonesEl = document.getElementById('llf-stat-phones');

    if (leadsEl) leadsEl.textContent = this.stats.totalLeads;
    if (emailsEl) emailsEl.textContent = this.stats.emailsFound;
    if (phonesEl) phonesEl.textContent = this.stats.phonesFound;
  }

  // ====== INTELLIGENT MODE METHODS ======

  /**
   * Analyze current page and recommend extraction strategy
   */
  async analyzeCurrentPage() {
    console.log('🔍 Analyzing current LinkedIn page...');

    this.currentPageAnalysis = this.pageAnalyzer.analyzePage();

    console.log('Page analysis:', this.currentPageAnalysis);

    // Recommend goal based on page type
    const recommendedGoal = this.goalEngine.recommendGoal(this.currentPageAnalysis);

    console.log('Recommended goal:', recommendedGoal.name);

    // Send analysis to popup
    chrome.runtime.sendMessage({
      type: 'PAGE_ANALYZED',
      analysis: this.currentPageAnalysis,
      recommendedGoal: recommendedGoal
    });

    return this.currentPageAnalysis;
  }

  /**
   * Set goal and start intelligent extraction
   */
  async startIntelligentMode(goalId, customInstructions = '') {
    console.log('🚀 Starting intelligent mode with goal:', goalId);

    // Set goal in engine
    const success = this.goalEngine.setGoal(goalId, customInstructions);

    if (!success) {
      console.error('Failed to set goal');
      return false;
    }

    this.currentGoal = this.goalEngine.currentGoal;
    this.intelligentMode = true;

    // Analyze page if not already done
    if (!this.currentPageAnalysis) {
      await this.analyzeCurrentPage();
    }

    // Generate extraction strategy
    const strategy = this.goalEngine.generateStrategy(this.currentGoal, this.currentPageAnalysis);

    console.log('Extraction strategy:', strategy);

    // Show notification
    this.showNotification(
      'Intelligent Mode Active',
      `Goal: ${this.currentGoal.name}\nPage: ${this.currentPageAnalysis.pageType}`
    );

    // Execute strategy
    if (this.settings.autopilotEnabled) {
      await this.executeIntelligentStrategy(strategy);
    }

    return true;
  }

  /**
   * Execute intelligent extraction strategy
   */
  async executeIntelligentStrategy(strategy) {
    console.log('⚙️ Executing intelligent extraction strategy...');

    const result = await this.intelligentExtractor.executeStrategy(strategy, {
      stepDelay: 1000
    });

    if (result.success) {
      console.log(`✅ Extraction complete: ${result.count} items extracted`);

      // Process extracted data
      await this.processIntelligentData(result.data);

      this.showNotification(
        'Extraction Complete',
        `Successfully extracted ${result.count} leads`
      );
    } else {
      console.error('❌ Extraction failed:', result.error);

      this.showNotification(
        'Extraction Failed',
        result.error || 'Unknown error occurred'
      );
    }

    return result;
  }

  /**
   * Process and save intelligently extracted data
   */
  async processIntelligentData(data) {
    console.log('Processing extracted data:', data.length, 'items');

    for (const item of data) {
      // Create lead object in standard format
      const lead = {
        id: `intelligent_${Date.now()}_${Math.random()}`,
        timestamp: item._timestamp || new Date().toISOString(),
        postUrl: item.profile_url || item.author_profile || window.location.href,
        authorName: item.name || item.author_name || 'Unknown',
        authorProfile: item.profile_url || item.author_profile || '',
        keywordMatched: ['intelligent_extraction'],
        postContent: item.comment_text || item.headline || item.content || '',
        emails: item.emails || [],
        phones: item.phones || [],
        exported: false,
        intelligentExtraction: true,
        goal: this.currentGoal?.name || 'Unknown',
        pageType: this.currentPageAnalysis?.pageType || 'Unknown',
        aiRelevant: item._aiRelevant,
        aiPriority: item._aiPriority,
        aiReason: item._aiReason,
        extractedFields: item
      };

      // Save lead
      await this.saveLead(lead);

      // Update stats
      this.updateStats({ emails: lead.emails, phones: lead.phones });
    }
  }

  /**
   * Stop intelligent mode
   */
  stopIntelligentMode() {
    console.log('⏹️ Stopping intelligent mode');

    this.intelligentMode = false;
    this.intelligentExtractor.stop();

    this.showNotification(
      'Intelligent Mode Stopped',
      'Extraction has been stopped'
    );
  }

  /**
   * Handle page navigation in intelligent mode
   */
  async handleIntelligentPageChange() {
    if (!this.intelligentMode || !this.settings.autopilotEnabled) {
      return;
    }

    // Re-analyze page
    await this.analyzeCurrentPage();

    // Check if goal is still compatible
    if (this.currentGoal) {
      const compatible = this.goalEngine.isGoalCompatible(
        this.currentGoal.id,
        this.currentPageAnalysis.pageType
      );

      if (compatible) {
        // Continue extraction on new page
        const strategy = this.goalEngine.generateStrategy(this.currentGoal, this.currentPageAnalysis);
        await this.executeIntelligentStrategy(strategy);
      } else {
        console.log('Current goal not compatible with this page type');
      }
    }
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'KEYWORDS_UPDATED':
        this.keywords = message.keywords;
        this.matcher.setKeywords(this.keywords);
        this.scannedPosts.clear();
        this.runScanIfReady();
        break;

      case 'SETTINGS_UPDATED':
        this.settings = message.settings;
        this.matcher.setOptions({
          caseSensitive: this.settings.caseSensitive,
          wholeWord: this.settings.wholeWord
        });
        this.runScanIfReady();
        break;

      case 'START_AUTO_SEARCH':
        this.ensureAutoSearchMonitor();
        break;

      // Intelligent mode messages
      case 'ANALYZE_PAGE':
        this.analyzeCurrentPage().then(analysis => {
          sendResponse({ success: true, analysis });
        });
        return true;  // Async response

      case 'START_INTELLIGENT_MODE':
        this.startIntelligentMode(message.goalId, message.customInstructions).then(success => {
          sendResponse({ success });
        });
        return true;  // Async response

      case 'STOP_INTELLIGENT_MODE':
        this.stopIntelligentMode();
        sendResponse({ success: true });
        break;

      case 'EXECUTE_STRATEGY':
        this.executeIntelligentStrategy(message.strategy).then(result => {
          sendResponse(result);
        });
        return true;  // Async response

      default:
        break;
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.rescanInterval) {
      clearInterval(this.rescanInterval);
      this.rescanInterval = null;
    }

    this.stopAutoSearch();

    // Remove UI elements
    const counter = document.getElementById('llf-stats-counter');
    if (counter) counter.remove();

    // Remove highlights
    document.querySelectorAll('.llf-matched-post').forEach(el => {
      el.classList.remove('llf-matched-post');
    });

    document.querySelectorAll('.llf-match-badge, .llf-contact-badge').forEach(el => {
      el.remove();
    });
  }
}

// Initialize scanner when script loads
const scanner = new LinkedInScanner();
