// Intelligent Page Analyzer for LinkedIn
class LinkedInPageAnalyzer {
  constructor() {
    this.pageTypes = {
      JOB_LISTING: 'job_listing',
      JOB_SEARCH: 'job_search',
      FEED: 'feed',
      POST_DETAIL: 'post_detail',
      PROFILE: 'profile',
      SEARCH_RESULTS: 'search_results',
      PEOPLE_SEARCH: 'people_search',
      COMPANY_PAGE: 'company_page',
      MESSAGING: 'messaging',
      UNKNOWN: 'unknown'
    };
  }

  /**
   * Analyze current page and determine type and extraction opportunities
   * @returns {Object} Analysis result with page type, extractable elements, and strategy
   */
  analyzePage() {
    const url = window.location.href;
    const pathname = window.location.pathname;

    const analysis = {
      pageType: this.detectPageType(url, pathname),
      url: url,
      extractableElements: [],
      recommendedStrategy: null,
      metadata: {}
    };

    // Analyze based on page type
    switch (analysis.pageType) {
      case this.pageTypes.JOB_LISTING:
        analysis.extractableElements = this.analyzeJobListing();
        analysis.recommendedStrategy = 'job_applicant_extraction';
        break;

      case this.pageTypes.JOB_SEARCH:
        analysis.extractableElements = this.analyzeJobSearch();
        analysis.recommendedStrategy = 'job_listing_extraction';
        break;

      case this.pageTypes.FEED:
        analysis.extractableElements = this.analyzeFeed();
        analysis.recommendedStrategy = 'post_based_lead_generation';
        break;

      case this.pageTypes.POST_DETAIL:
        analysis.extractableElements = this.analyzePostDetail();
        analysis.recommendedStrategy = 'comment_contact_extraction';
        break;

      case this.pageTypes.PROFILE:
        analysis.extractableElements = this.analyzeProfile();
        analysis.recommendedStrategy = 'profile_contact_extraction';
        break;

      case this.pageTypes.SEARCH_RESULTS:
        analysis.extractableElements = this.analyzeSearchResults();
        analysis.recommendedStrategy = 'content_based_extraction';
        break;

      case this.pageTypes.PEOPLE_SEARCH:
        analysis.extractableElements = this.analyzePeopleSearch();
        analysis.recommendedStrategy = 'people_list_extraction';
        break;

      case this.pageTypes.COMPANY_PAGE:
        analysis.extractableElements = this.analyzeCompanyPage();
        analysis.recommendedStrategy = 'company_contact_extraction';
        break;
    }

    return analysis;
  }

  /**
   * Detect the type of LinkedIn page
   */
  detectPageType(url, pathname) {
    if (pathname.includes('/jobs/view/') || pathname.includes('/jobs/collections/')) {
      return this.pageTypes.JOB_LISTING;
    }
    if (pathname.includes('/jobs/search/') || pathname === '/jobs/') {
      return this.pageTypes.JOB_SEARCH;
    }
    if (pathname === '/feed/' || pathname === '/') {
      return this.pageTypes.FEED;
    }
    if (pathname.includes('/posts/') || url.includes('/feed/update/')) {
      return this.pageTypes.POST_DETAIL;
    }
    if (pathname.includes('/in/')) {
      return this.pageTypes.PROFILE;
    }
    if (pathname.includes('/search/results/content/')) {
      return this.pageTypes.SEARCH_RESULTS;
    }
    if (pathname.includes('/search/results/people/')) {
      return this.pageTypes.PEOPLE_SEARCH;
    }
    if (pathname.includes('/company/')) {
      return this.pageTypes.COMPANY_PAGE;
    }
    if (pathname.includes('/messaging/')) {
      return this.pageTypes.MESSAGING;
    }

    return this.pageTypes.UNKNOWN;
  }

  /**
   * Analyze job listing page for applicant data
   */
  analyzeJobListing() {
    const elements = [];

    // Job applicants section
    const applicantsSection = document.querySelector('.jobs-unified-top-card__applicant-count');
    if (applicantsSection) {
      elements.push({
        type: 'applicant_count',
        element: applicantsSection,
        extractable: ['applicant_count', 'applicant_list']
      });
    }

    // "See applications" or "View applicants" buttons
    const applicantButtons = document.querySelectorAll('button[aria-label*="applicant" i], button[aria-label*="application" i]');
    if (applicantButtons.length > 0) {
      elements.push({
        type: 'applicant_access',
        element: applicantButtons[0],
        extractable: ['applicant_profiles', 'resumes']
      });
    }

    // Job details
    const jobTitle = document.querySelector('.jobs-unified-top-card__job-title');
    const company = document.querySelector('.jobs-unified-top-card__company-name');
    if (jobTitle || company) {
      elements.push({
        type: 'job_metadata',
        extractable: ['job_title', 'company_name', 'location', 'job_description']
      });
    }

    return elements;
  }

  /**
   * Analyze job search page
   */
  analyzeJobSearch() {
    const elements = [];

    const jobCards = document.querySelectorAll('.job-card-container, .jobs-search-results__list-item');
    if (jobCards.length > 0) {
      elements.push({
        type: 'job_listings',
        count: jobCards.length,
        extractable: ['job_list', 'bulk_job_data']
      });
    }

    return elements;
  }

  /**
   * Analyze feed for posts
   */
  analyzeFeed() {
    const elements = [];

    const posts = document.querySelectorAll('[data-id^="urn:li:activity"], .feed-shared-update-v2');
    if (posts.length > 0) {
      elements.push({
        type: 'posts',
        count: posts.length,
        extractable: ['post_content', 'post_authors', 'post_engagement', 'comments']
      });
    }

    return elements;
  }

  /**
   * Analyze individual post detail page
   */
  analyzePostDetail() {
    const elements = [];

    // Post content
    const postContent = document.querySelector('.feed-shared-update-v2__description, [data-test-id="main-feed-activity-card__commentary"]');
    if (postContent) {
      elements.push({
        type: 'post_content',
        extractable: ['author', 'content', 'engagement']
      });
    }

    // Comments section
    const comments = document.querySelectorAll('.comments-comment-item, [data-test-id="comment"]');
    if (comments.length > 0) {
      elements.push({
        type: 'comments',
        count: comments.length,
        extractable: ['comment_authors', 'comment_content', 'comment_contacts']
      });
    }

    // "See more comments" button
    const loadMoreComments = document.querySelector('button[aria-label*="more comment" i]');
    if (loadMoreComments) {
      elements.push({
        type: 'expandable_comments',
        extractable: ['all_comments']
      });
    }

    return elements;
  }

  /**
   * Analyze profile page
   */
  analyzeProfile() {
    const elements = [];

    // Contact info section
    const contactInfo = document.querySelector('#top-card-text-details-contact-info, [data-test-id="top-card-text-details-contact-info"]');
    if (contactInfo) {
      elements.push({
        type: 'contact_info',
        extractable: ['email', 'phone', 'website', 'social_links']
      });
    }

    // About section
    const about = document.querySelector('.pv-about-section, [data-test-id="about-section"]');
    if (about) {
      elements.push({
        type: 'about',
        extractable: ['bio', 'contact_info_from_bio']
      });
    }

    // Experience section
    const experience = document.querySelector('.experience-section, [data-test-id="experience-section"]');
    if (experience) {
      elements.push({
        type: 'experience',
        extractable: ['work_history', 'companies']
      });
    }

    return elements;
  }

  /**
   * Analyze search results page
   */
  analyzeSearchResults() {
    const elements = [];

    const results = document.querySelectorAll('.search-results__list li, [data-test-id="search-result"]');
    if (results.length > 0) {
      elements.push({
        type: 'search_results',
        count: results.length,
        extractable: ['result_posts', 'result_authors', 'result_content']
      });
    }

    return elements;
  }

  /**
   * Analyze people search results
   */
  analyzePeopleSearch() {
    const elements = [];

    const peopleCards = document.querySelectorAll('.entity-result, .reusable-search__result-container');
    if (peopleCards.length > 0) {
      elements.push({
        type: 'people_results',
        count: peopleCards.length,
        extractable: ['profiles', 'names', 'titles', 'companies', 'locations']
      });
    }

    return elements;
  }

  /**
   * Analyze company page
   */
  analyzeCompanyPage() {
    const elements = [];

    // Company info
    const companyInfo = document.querySelector('.org-top-card, [data-test-id="org-top-card"]');
    if (companyInfo) {
      elements.push({
        type: 'company_info',
        extractable: ['company_name', 'website', 'industry', 'size', 'location']
      });
    }

    // Employees section
    const employees = document.querySelector('.org-people-bar, [data-test-id="org-people-bar"]');
    if (employees) {
      elements.push({
        type: 'employees',
        extractable: ['employee_list', 'employee_count']
      });
    }

    // Posts
    const posts = document.querySelectorAll('[data-id^="urn:li:activity"]');
    if (posts.length > 0) {
      elements.push({
        type: 'company_posts',
        count: posts.length,
        extractable: ['post_content', 'engagement']
      });
    }

    return elements;
  }

  /**
   * Get extraction selectors for specific data types
   */
  getExtractionSelectors(dataType) {
    const selectors = {
      // Comments
      comments: [
        '.comments-comment-item',
        '[data-test-id="comment"]',
        '.comment-item',
        'article[data-id*="comment"]'
      ],
      comment_author: [
        '.comments-post-meta__name-text',
        '[data-test-id="comment-author"]',
        '.comment-author'
      ],
      comment_content: [
        '.comments-comment-item__main-content',
        '[data-test-id="comment-content"]',
        '.comment-text'
      ],

      // Jobs
      job_cards: [
        '.job-card-container',
        '.jobs-search-results__list-item',
        '[data-job-id]'
      ],
      applicant_button: [
        'button[aria-label*="applicant" i]',
        'button[aria-label*="application" i]',
        '.job-details-jobs-unified-top-card__applicants-button'
      ],

      // People
      profile_cards: [
        '.entity-result',
        '.reusable-search__result-container',
        '[data-test-id="search-result"]'
      ],
      profile_name: [
        '.entity-result__title-text',
        '[data-test-id="profile-name"]',
        '.actor-name'
      ],
      profile_headline: [
        '.entity-result__primary-subtitle',
        '[data-test-id="profile-headline"]'
      ],

      // Contact info
      contact_section: [
        '#top-card-text-details-contact-info',
        '[data-test-id="contact-info"]',
        '.pv-contact-info'
      ],
      email_link: [
        'a[href^="mailto:"]',
        '[data-test-id="email"]'
      ],
      phone_link: [
        'a[href^="tel:"]',
        '[data-test-id="phone"]'
      ]
    };

    return selectors[dataType] || [];
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.LinkedInPageAnalyzer = LinkedInPageAnalyzer;
}
