// Goal-Based Extraction Engine
class GoalEngine {
  constructor() {
    this.goalTemplates = {
      JOB_APPLICANTS: {
        id: 'job_applicants',
        name: 'Extract Job Applicants & Resumes',
        description: 'Download applicant profiles and resumes from job listings',
        compatiblePages: ['job_listing'],
        extractionTargets: ['applicant_profiles', 'resumes', 'contact_info'],
        actions: ['navigate_to_applicants', 'download_resumes', 'extract_contacts']
      },
      COMMENT_MINING: {
        id: 'comment_mining',
        name: 'Mine Comments for Contacts',
        description: 'Extract emails and contacts from post comments',
        compatiblePages: ['post_detail', 'feed', 'search_results'],
        extractionTargets: ['comment_authors', 'emails', 'phones', 'profiles'],
        actions: ['expand_comments', 'extract_comment_contacts', 'save_profiles']
      },
      POST_ENGAGEMENT: {
        id: 'post_engagement',
        name: 'Target Audience from Posts',
        description: 'Find people engaging with relevant posts',
        compatiblePages: ['feed', 'search_results', 'post_detail'],
        extractionTargets: ['likers', 'commenters', 'sharers', 'profiles'],
        actions: ['identify_engagers', 'extract_profiles', 'assess_relevance']
      },
      PEOPLE_DISCOVERY: {
        id: 'people_discovery',
        name: 'Discover People by Criteria',
        description: 'Find and extract profiles matching your criteria',
        compatiblePages: ['people_search', 'company_page'],
        extractionTargets: ['profiles', 'contact_info', 'job_titles', 'companies'],
        actions: ['scan_profiles', 'extract_details', 'filter_by_criteria']
      },
      COMPANY_INTEL: {
        id: 'company_intel',
        name: 'Company Intelligence Gathering',
        description: 'Extract company employees and decision makers',
        compatiblePages: ['company_page', 'people_search'],
        extractionTargets: ['employees', 'executives', 'contact_info'],
        actions: ['find_employees', 'identify_decision_makers', 'extract_contacts']
      },
      KEYWORD_HUNTING: {
        id: 'keyword_hunting',
        name: 'Keyword-Based Lead Generation',
        description: 'Find leads based on keywords in posts/profiles',
        compatiblePages: ['feed', 'search_results', 'profile'],
        extractionTargets: ['posts', 'profiles', 'contact_info'],
        actions: ['search_keywords', 'match_content', 'extract_leads']
      },
      CUSTOM: {
        id: 'custom',
        name: 'Custom Goal',
        description: 'Define your own extraction goal',
        compatiblePages: ['all'],
        extractionTargets: [],
        actions: []
      }
    };

    this.currentGoal = null;
    this.customInstructions = '';
  }

  /**
   * Set the current goal
   */
  setGoal(goalId, customInstructions = '') {
    const goalTemplate = Object.values(this.goalTemplates).find(g => g.id === goalId);

    if (!goalTemplate) {
      console.error('Invalid goal ID:', goalId);
      return false;
    }

    this.currentGoal = {
      ...goalTemplate,
      customInstructions,
      active: true,
      timestamp: new Date().toISOString()
    };

    return true;
  }

  /**
   * Get recommended goal based on page analysis
   */
  recommendGoal(pageAnalysis) {
    const pageType = pageAnalysis.pageType;

    // Find goals compatible with current page
    const compatibleGoals = Object.values(this.goalTemplates).filter(goal => {
      return goal.compatiblePages.includes(pageType) ||
             goal.compatiblePages.includes('all');
    });

    // Return the most relevant goal
    if (compatibleGoals.length > 0) {
      return compatibleGoals[0];
    }

    return this.goalTemplates.CUSTOM;
  }

  /**
   * Generate extraction strategy based on goal and page
   */
  generateStrategy(goal, pageAnalysis) {
    const strategy = {
      goal: goal.name,
      goalId: goal.id,
      pageType: pageAnalysis.pageType,
      steps: [],
      selectors: {},
      aiPrompt: this.generateAIPrompt(goal, pageAnalysis),
      extractionConfig: {}
    };

    // Generate steps based on goal type
    switch (goal.id) {
      case 'job_applicants':
        strategy.steps = this.generateJobApplicantSteps(pageAnalysis);
        break;

      case 'comment_mining':
        strategy.steps = this.generateCommentMiningSteps(pageAnalysis);
        break;

      case 'post_engagement':
        strategy.steps = this.generatePostEngagementSteps(pageAnalysis);
        break;

      case 'people_discovery':
        strategy.steps = this.generatePeopleDiscoverySteps(pageAnalysis);
        break;

      case 'company_intel':
        strategy.steps = this.generateCompanyIntelSteps(pageAnalysis);
        break;

      case 'keyword_hunting':
        strategy.steps = this.generateKeywordHuntingSteps(pageAnalysis);
        break;

      case 'custom':
        strategy.steps = this.generateCustomSteps(goal, pageAnalysis);
        break;
    }

    return strategy;
  }

  /**
   * Generate AI prompt for intelligent extraction
   */
  generateAIPrompt(goal, pageAnalysis) {
    const basePrompt = `You are an intelligent data extraction assistant. Your task is to help extract relevant information from LinkedIn pages.

**Current Goal**: ${goal.name}
**Goal Description**: ${goal.description}
**Page Type**: ${pageAnalysis.pageType}
**Target Data**: ${goal.extractionTargets.join(', ')}

**Custom Instructions**: ${goal.customInstructions || 'None'}

Analyze the provided content and determine:
1. Is this content relevant to the goal?
2. What specific data should be extracted?
3. What is the quality/priority of this lead (0-100)?

Return a JSON response with:
{
  "relevant": boolean,
  "reason": "explanation",
  "priority": number (0-100),
  "extractionTargets": ["field1", "field2"],
  "suggestedFields": {
    "field_name": "extracted_value"
  }
}`;

    return basePrompt;
  }

  /**
   * Step generators for different goals
   */
  generateJobApplicantSteps(pageAnalysis) {
    return [
      {
        action: 'detect_applicant_count',
        description: 'Check number of applicants',
        selector: '.jobs-unified-top-card__applicant-count'
      },
      {
        action: 'click_view_applicants',
        description: 'Click to view applicants',
        selector: 'button[aria-label*="applicant" i]',
        waitFor: '.job-details-applicant-list'
      },
      {
        action: 'scroll_applicant_list',
        description: 'Scroll through applicant list',
        scrollCycles: 10
      },
      {
        action: 'extract_applicant_data',
        description: 'Extract applicant profiles',
        dataFields: ['name', 'headline', 'profile_url', 'resume_url', 'application_date']
      },
      {
        action: 'download_resumes',
        description: 'Download available resumes',
        selector: 'a[href*="resume"], a[download]'
      }
    ];
  }

  generateCommentMiningSteps(pageAnalysis) {
    return [
      {
        action: 'expand_post_content',
        description: 'Expand post to full content',
        selector: 'button.feed-shared-inline-show-more-text__see-more-less-toggle'
      },
      {
        action: 'scroll_to_comments',
        description: 'Scroll to comments section',
        selector: '.comments-comments-list'
      },
      {
        action: 'load_all_comments',
        description: 'Click to load all comments',
        selector: 'button[aria-label*="more comment" i]',
        repeatUntilGone: true
      },
      {
        action: 'extract_comments',
        description: 'Extract comment data',
        selector: '.comments-comment-item',
        dataFields: ['author_name', 'author_profile', 'comment_text', 'timestamp']
      },
      {
        action: 'extract_contacts_from_comments',
        description: 'Find emails and phones in comments',
        useExtractor: true
      },
      {
        action: 'analyze_comment_relevance',
        description: 'Use AI to assess comment relevance',
        useAI: true
      }
    ];
  }

  generatePostEngagementSteps(pageAnalysis) {
    return [
      {
        action: 'identify_post',
        description: 'Identify target post',
        selector: '[data-id^="urn:li:activity"]'
      },
      {
        action: 'click_reactions',
        description: 'View people who reacted',
        selector: 'button[aria-label*="reaction" i], button.reactions-react-button'
      },
      {
        action: 'extract_reactors',
        description: 'Extract profiles of people who reacted',
        dataFields: ['name', 'headline', 'profile_url']
      },
      {
        action: 'extract_commenters',
        description: 'Extract commenter profiles',
        selector: '.comments-comment-item',
        dataFields: ['author_name', 'author_profile', 'comment_text']
      },
      {
        action: 'assess_engagement_quality',
        description: 'Use AI to rate lead quality based on engagement',
        useAI: true
      }
    ];
  }

  generatePeopleDiscoverySteps(pageAnalysis) {
    return [
      {
        action: 'scroll_results',
        description: 'Scroll through search results',
        scrollCycles: 10
      },
      {
        action: 'extract_profile_cards',
        description: 'Extract profile card data',
        selector: '.entity-result, .reusable-search__result-container',
        dataFields: ['name', 'headline', 'location', 'profile_url', 'mutual_connections']
      },
      {
        action: 'click_profiles',
        description: 'Visit individual profiles for detailed info',
        openInNewTab: true
      },
      {
        action: 'extract_contact_info',
        description: 'Extract contact information from profiles',
        selector: '#top-card-text-details-contact-info',
        dataFields: ['email', 'phone', 'website']
      }
    ];
  }

  generateCompanyIntelSteps(pageAnalysis) {
    return [
      {
        action: 'extract_company_info',
        description: 'Extract company details',
        dataFields: ['company_name', 'website', 'industry', 'size', 'headquarters']
      },
      {
        action: 'navigate_to_people',
        description: 'Go to company people page',
        url: '/people/'
      },
      {
        action: 'filter_by_role',
        description: 'Filter employees by role (e.g., decision makers)',
        useAI: true
      },
      {
        action: 'extract_employee_list',
        description: 'Extract employee profiles',
        dataFields: ['name', 'title', 'profile_url', 'tenure']
      }
    ];
  }

  generateKeywordHuntingSteps(pageAnalysis) {
    return [
      {
        action: 'scan_content',
        description: 'Scan page content for keywords',
        useKeywordMatcher: true
      },
      {
        action: 'extract_matched_content',
        description: 'Extract content with keyword matches',
        dataFields: ['author', 'content', 'url', 'keywords_matched']
      },
      {
        action: 'extract_contacts',
        description: 'Extract contact information',
        useExtractor: true
      },
      {
        action: 'assess_relevance',
        description: 'Use AI to assess lead quality',
        useAI: true
      }
    ];
  }

  generateCustomSteps(goal, pageAnalysis) {
    // For custom goals, use AI to determine steps
    return [
      {
        action: 'analyze_with_ai',
        description: 'Analyze page structure and determine extraction strategy',
        useAI: true,
        aiTask: 'strategy_generation'
      },
      {
        action: 'execute_ai_strategy',
        description: 'Execute AI-generated extraction strategy',
        useAI: true
      }
    ];
  }

  /**
   * Get all available goal templates
   */
  getGoalTemplates() {
    return this.goalTemplates;
  }

  /**
   * Check if goal is compatible with current page
   */
  isGoalCompatible(goalId, pageType) {
    const goal = Object.values(this.goalTemplates).find(g => g.id === goalId);
    if (!goal) return false;

    return goal.compatiblePages.includes(pageType) ||
           goal.compatiblePages.includes('all');
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.GoalEngine = GoalEngine;
}
