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
    try {
      this.pageAnalyzer = new LinkedInPageAnalyzer();
      this.goalEngine = new GoalEngine();
      this.intelligentExtractor = new IntelligentExtractor();
      this.aiScraper = new AIScraper();
      console.log('✅ Intelligent mode components initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing intelligent mode components:', error);
      // Fallback to null so extension still works in classic mode
      this.pageAnalyzer = null;
      this.goalEngine = null;
      this.intelligentExtractor = null;
      this.aiScraper = null;
    }

    this.intelligentMode = false;
    this.aiDrivenMode = false;
    this.currentGoal = null;
    this.currentGoalDescription = '';
    this.currentPageAnalysis = null;
    this.currentAIStrategy = null;

    // Multi-keyword AI mode state
    this.aiMultiKeywordMode = false;
    this.aiKeywords = [];
    this.aiCurrentKeywordIndex = 0;
    this.aiKeywordStateKey = 'llfAIKeywordState';

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

    // Check if we should resume multi-keyword AI mode
    this.resumeAIKeywordMode().catch(err => {
      console.error('Failed to resume AI keyword mode:', err);
    });

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

    if (!this.pageAnalyzer || !this.goalEngine) {
      console.error('❌ Intelligent mode components not available');
      throw new Error('Co-pilot components failed to initialize. Please reload the extension.');
    }

    try {
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
    } catch (error) {
      console.error('❌ Error during page analysis:', error);
      throw error;
    }
  }

  /**
   * Set goal and start intelligent extraction
   */
  async startIntelligentMode(goalId, customInstructions = '') {
    console.log('🚀 Starting intelligent mode with goal:', goalId);

    if (!this.goalEngine || !this.intelligentExtractor) {
      console.error('❌ Intelligent mode components not available');
      throw new Error('Co-pilot components failed to initialize. Please reload the extension.');
    }

    try {
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
    } catch (error) {
      console.error('❌ Error starting intelligent mode:', error);
      throw error;
    }
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

  // ====== AI-DRIVEN MODE METHODS ======

  /**
   * Start AI-driven extraction mode
   * Uses AI to analyze HTML and generate extraction strategy on the fly
   * @param {string} userGoal - What the user wants to extract (plain English)
   */
  async startAIDrivenMode(userGoal) {
    console.log('🤖 Starting AI-driven extraction mode');
    console.log(`User goal: ${userGoal}`);

    if (!this.aiScraper) {
      throw new Error('AI Scraper not initialized. Please reload the extension.');
    }

    if (!userGoal || userGoal.trim().length === 0) {
      throw new Error('Please describe what you want to extract');
    }

    try {
      this.aiDrivenMode = true;
      this.currentGoalDescription = userGoal;

      // Step 1: Capture page context (HTML + metadata)
      console.log('📸 Capturing page context...');
      const pageContext = this.aiScraper.capturePageContext();
      console.log(`Captured ${pageContext.htmlSize} chars of HTML`);

      // Step 2: Generate extraction strategy using AI
      console.log('🧠 Generating extraction strategy with AI...');
      const strategy = await this.aiScraper.generateExtractionStrategy(userGoal, pageContext);
      this.currentAIStrategy = strategy;

      console.log('✅ AI strategy generated:', strategy);

      // Show notification
      this.showNotification(
        'AI Analysis Complete',
        `Page type: ${strategy.pageType}\nFound ${strategy.dataAvailable.length} extractable fields`
      );

      // Step 3: Execute strategy if autopilot enabled
      if (this.settings.autopilotEnabled) {
        console.log('🚀 Autopilot enabled, executing strategy...');
        await this.executeAIStrategy(strategy);
      }

      return {
        success: true,
        strategy: strategy,
        pageContext: {
          url: pageContext.url,
          title: pageContext.title,
          htmlSize: pageContext.htmlSize
        }
      };

    } catch (error) {
      console.error('❌ Error starting AI-driven mode:', error);
      this.aiDrivenMode = false;
      throw error;
    }
  }

  /**
   * Execute AI-generated extraction strategy
   * @param {Object} strategy - AI-generated strategy
   */
  async executeAIStrategy(strategy) {
    console.log('⚙️ Executing AI-generated extraction strategy...');

    try {
      const result = await this.aiScraper.executeStrategy(strategy, {
        stepDelay: 1000,
        maxItems: 100
      });

      if (result.success && result.data.length > 0) {
        console.log(`✅ AI extraction complete: ${result.count} items extracted`);

        // Process extracted data
        await this.processAIExtractedData(result.data, strategy);

        this.showNotification(
          'AI Extraction Complete',
          `Successfully extracted ${result.count} leads`
        );
      } else {
        console.log('ℹ️ No data extracted');
        this.showNotification(
          'No Data Found',
          'Could not extract any data from this page'
        );
      }

      return result;

    } catch (error) {
      console.error('❌ Error executing AI strategy:', error);
      this.showNotification(
        'Extraction Failed',
        error.message || 'Unknown error occurred'
      );
      throw error;
    }
  }

  /**
   * Process AI-extracted data and save as leads
   * @param {Array} data - Extracted data items
   * @param {Object} strategy - Strategy used for extraction
   */
  async processAIExtractedData(data, strategy) {
    console.log('💾 Processing AI-extracted data:', data.length, 'items');

    for (const item of data) {
      // Extract emails and phones from the item
      const allText = Object.values(item).filter(v => typeof v === 'string').join(' ');
      const extractedContacts = this.extractor.extractAll(allText);

      // Create lead object
      const lead = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: item.timestamp || new Date().toISOString(),
        postUrl: item.sourceUrl || window.location.href,
        authorName: item.author || item.name || 'Unknown',
        authorProfile: item.profileUrl || item.authorProfile || '',
        keywordMatched: [`AI: ${this.currentGoalDescription}`],
        postContent: item.content || item.postContent || JSON.stringify(item).substring(0, 500),
        emails: extractedContacts.emails || [],
        phones: extractedContacts.phones || [],
        exported: false,
        aiExtracted: true,
        aiGoal: this.currentGoalDescription,
        pageType: strategy.pageType,
        extractedFields: item
      };

      // Only save if we found contacts or if user wants all data
      if (lead.emails.length > 0 || lead.phones.length > 0) {
        await this.saveLead(lead);
        this.updateStats({ emails: lead.emails, phones: lead.phones });
        console.log(`💾 Saved lead: ${lead.authorName} (${lead.emails.length} emails, ${lead.phones.length} phones)`);
      }
    }
  }

  /**
   * Stop AI-driven mode
   */
  stopAIDrivenMode() {
    console.log('⏹️ Stopping AI-driven mode');

    this.aiDrivenMode = false;
    this.currentGoalDescription = '';
    this.currentAIStrategy = null;

    this.showNotification(
      'AI Mode Stopped',
      'AI extraction has been stopped'
    );
  }

  // ====== MULTI-KEYWORD AI MODE METHODS ======

  /**
   * Start multi-keyword AI mode
   * Cycles through keywords, navigating LinkedIn search and extracting with AI
   * @param {string} userGoal - What to extract (plain English)
   * @param {Array<string>} keywords - List of keywords to search
   */
  async startMultiKeywordAIMode(userGoal, keywords) {
    console.log('🚀 Starting multi-keyword AI mode');
    console.log(`Goal: ${userGoal}`);
    console.log(`Keywords: ${keywords.join(', ')}`);

    if (!keywords || keywords.length === 0) {
      throw new Error('Please provide at least one keyword');
    }

    this.aiMultiKeywordMode = true;
    this.aiDrivenMode = true;
    this.currentGoalDescription = userGoal;
    this.aiKeywords = keywords;
    this.aiCurrentKeywordIndex = 0;

    // Save state to storage for persistence across page loads
    await this.saveAIKeywordState();

    // Start with first keyword
    await this.processNextAIKeyword();
  }

  /**
   * Save AI keyword state to storage
   */
  async saveAIKeywordState() {
    const state = {
      active: this.aiMultiKeywordMode,
      userGoal: this.currentGoalDescription,
      keywords: this.aiKeywords,
      currentIndex: this.aiCurrentKeywordIndex,
      timestamp: Date.now()
    };

    await chrome.storage.local.set({ [this.aiKeywordStateKey]: state });
    console.log('💾 Saved AI keyword state:', state);
  }

  /**
   * Load AI keyword state from storage
   */
  async loadAIKeywordState() {
    try {
      const data = await chrome.storage.local.get([this.aiKeywordStateKey]);
      const state = data[this.aiKeywordStateKey];

      if (!state || !state.active) {
        return null;
      }

      // Check if state is stale (older than 1 hour)
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - state.timestamp > oneHour) {
        console.log('⏰ AI keyword state is stale, clearing...');
        await this.clearAIKeywordState();
        return null;
      }

      return state;
    } catch (error) {
      console.error('Error loading AI keyword state:', error);
      return null;
    }
  }

  /**
   * Clear AI keyword state
   */
  async clearAIKeywordState() {
    await chrome.storage.local.remove([this.aiKeywordStateKey]);
  }

  /**
   * Resume AI keyword mode from saved state (called on page load)
   */
  async resumeAIKeywordMode() {
    const state = await this.loadAIKeywordState();

    if (!state) {
      return false;
    }

    console.log('🔄 Resuming multi-keyword AI mode from state');
    this.aiMultiKeywordMode = true;
    this.aiDrivenMode = true;
    this.currentGoalDescription = state.userGoal;
    this.aiKeywords = state.keywords;
    this.aiCurrentKeywordIndex = state.currentIndex;

    // Wait for page to fully load before processing
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Wait a bit more for LinkedIn to render
    await this.sleep(3000);

    // Process current page with AI
    await this.processCurrentPageWithAI();

    return true;
  }

  /**
   * Process next keyword in the list
   */
  async processNextAIKeyword() {
    if (this.aiCurrentKeywordIndex >= this.aiKeywords.length) {
      console.log('✅ All keywords processed!');
      await this.stopMultiKeywordAIMode(true);
      return;
    }

    const keyword = this.aiKeywords[this.aiCurrentKeywordIndex];
    console.log(`🔍 Processing keyword ${this.aiCurrentKeywordIndex + 1}/${this.aiKeywords.length}: "${keyword}"`);

    // Show notification
    this.showNotification(
      'AI Multi-Keyword Mode',
      `Searching keyword ${this.aiCurrentKeywordIndex + 1}/${this.aiKeywords.length}: ${keyword}`
    );

    // Navigate to keyword search
    await this.navigateToKeyword(keyword);

    // State will be resumed when page loads
  }

  /**
   * Process current page with AI extraction
   */
  async processCurrentPageWithAI() {
    try {
      console.log('🤖 Processing current page with AI...');

      // Auto-scroll to load more content if enabled
      if (this.settings.autoScrollEnabled) {
        console.log('📜 Auto-scrolling to load more content...');
        await this.autoScrollAndScan();

        // Wait a bit for content to settle
        await this.sleep(2000);
      }

      // Capture page context
      const pageContext = this.aiScraper.capturePageContext();
      console.log(`📸 Captured page: ${pageContext.htmlSize} chars`);

      // Generate extraction strategy with AI
      const strategy = await this.aiScraper.generateExtractionStrategy(
        this.currentGoalDescription,
        pageContext
      );

      this.currentAIStrategy = strategy;
      console.log('✅ AI strategy generated:', strategy.pageType);

      // Execute extraction
      const result = await this.aiScraper.executeStrategy(strategy, {
        stepDelay: 1000,
        maxItems: 100
      });

      if (result.success && result.data.length > 0) {
        console.log(`✅ Extracted ${result.count} items from this page`);
        await this.processAIExtractedData(result.data, strategy);

        this.showNotification(
          'Extraction Complete',
          `Found ${result.count} items for keyword: ${this.aiKeywords[this.aiCurrentKeywordIndex]}`
        );
      } else {
        console.log('ℹ️ No data extracted from this page');
      }

      // Move to next keyword after delay
      await this.sleep(this.settings.autoSearchDelay || 5000);

      this.aiCurrentKeywordIndex++;
      await this.saveAIKeywordState();
      await this.processNextAIKeyword();

    } catch (error) {
      console.error('❌ Error processing page with AI:', error);

      // Continue to next keyword even if one fails
      this.aiCurrentKeywordIndex++;
      await this.saveAIKeywordState();
      await this.processNextAIKeyword();
    }
  }

  /**
   * Stop multi-keyword AI mode
   */
  async stopMultiKeywordAIMode(completed = false) {
    console.log('⏹️ Stopping multi-keyword AI mode');

    this.aiMultiKeywordMode = false;
    this.aiDrivenMode = false;
    this.currentGoalDescription = '';
    this.currentAIStrategy = null;
    this.aiKeywords = [];
    this.aiCurrentKeywordIndex = 0;

    await this.clearAIKeywordState();

    const message = completed
      ? 'All keywords processed successfully!'
      : 'Multi-keyword AI mode stopped';

    this.showNotification(
      completed ? 'AI Mode Complete' : 'AI Mode Stopped',
      message
    );

    // Notify popup
    chrome.runtime.sendMessage({
      type: 'AI_MULTI_KEYWORD_STOPPED',
      completed: completed
    }, () => {
      void chrome.runtime.lastError; // Suppress errors if popup closed
    });
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
        this.analyzeCurrentPage()
          .then(analysis => {
            sendResponse({ success: true, analysis });
          })
          .catch(error => {
            console.error('Error in ANALYZE_PAGE handler:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true;  // Async response

      case 'START_INTELLIGENT_MODE':
        this.startIntelligentMode(message.goalId, message.customInstructions)
          .then(result => {
            sendResponse({ success: true, result });
          })
          .catch(error => {
            console.error('Error in START_INTELLIGENT_MODE handler:', error);
            sendResponse({ success: false, error: error.message });
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

      // AI-driven mode messages
      case 'START_AI_MODE':
        this.startAIDrivenMode(message.userGoal)
          .then(result => {
            sendResponse({ success: true, result });
          })
          .catch(error => {
            console.error('Error in START_AI_MODE handler:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true;  // Async response

      case 'STOP_AI_MODE':
        this.stopAIDrivenMode();
        sendResponse({ success: true });
        break;

      // Multi-keyword AI mode messages
      case 'START_MULTI_KEYWORD_AI':
        this.startMultiKeywordAIMode(message.userGoal, message.keywords)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch(error => {
            console.error('Error in START_MULTI_KEYWORD_AI handler:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true;  // Async response

      case 'STOP_MULTI_KEYWORD_AI':
        this.stopMultiKeywordAIMode(false)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch(error => {
            console.error('Error in STOP_MULTI_KEYWORD_AI handler:', error);
            sendResponse({ success: false, error: error.message });
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
