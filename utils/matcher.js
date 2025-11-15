// Keyword Matcher
class KeywordMatcher {
  constructor(keywords = [], options = {}) {
    this.keywords = keywords;
    this.options = {
      caseSensitive: options.caseSensitive || false,
      wholeWord: options.wholeWord || false,
      ...options
    };
  }

  /**
   * Update keywords
   * @param {Array<string>} keywords - New keywords array
   */
  setKeywords(keywords) {
    this.keywords = keywords || [];
  }

  /**
   * Update options
   * @param {Object} options - New options
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
  }

  /**
   * Check if text matches any keyword
   * @param {string} text - Text to check
   * @returns {Object} Match result with matched keywords
   */
  match(text) {
    if (!text || !this.keywords || this.keywords.length === 0) {
      return { matched: false, keywords: [] };
    }

    const matchedKeywords = [];

    for (const keyword of this.keywords) {
      if (this.matchSingle(text, keyword)) {
        matchedKeywords.push(keyword);
      }
    }

    return {
      matched: matchedKeywords.length > 0,
      keywords: matchedKeywords
    };
  }

  /**
   * Match single keyword against text
   * @param {string} text - Text to search in
   * @param {string} keyword - Keyword to search for
   * @returns {boolean}
   */
  matchSingle(text, keyword) {
    if (!text || !keyword) return false;

    let searchText = text;
    let searchKeyword = keyword;

    // Handle case sensitivity
    if (!this.options.caseSensitive) {
      searchText = text.toLowerCase();
      searchKeyword = keyword.toLowerCase();
    }

    // Whole word matching
    if (this.options.wholeWord) {
      const regex = new RegExp(`\\b${this.escapeRegex(searchKeyword)}\\b`, 'g');
      return regex.test(searchText);
    }

    // Partial matching (default)
    return searchText.includes(searchKeyword);
  }

  /**
   * Get all matches with positions
   * @param {string} text - Text to search in
   * @returns {Array} Array of match objects with position info
   */
  findAllMatches(text) {
    if (!text || !this.keywords || this.keywords.length === 0) {
      return [];
    }

    const matches = [];

    for (const keyword of this.keywords) {
      const keywordMatches = this.findKeywordMatches(text, keyword);
      matches.push(...keywordMatches);
    }

    return matches;
  }

  /**
   * Find all matches for a single keyword
   * @param {string} text - Text to search in
   * @param {string} keyword - Keyword to find
   * @returns {Array} Array of match objects
   */
  findKeywordMatches(text, keyword) {
    const matches = [];
    let searchText = text;
    let searchKeyword = keyword;

    if (!this.options.caseSensitive) {
      searchText = text.toLowerCase();
      searchKeyword = keyword.toLowerCase();
    }

    let index = 0;
    while (index < searchText.length) {
      let position = -1;

      if (this.options.wholeWord) {
        const regex = new RegExp(`\\b${this.escapeRegex(searchKeyword)}\\b`, 'g');
        regex.lastIndex = index;
        const match = regex.exec(searchText);
        if (match) {
          position = match.index;
        }
      } else {
        position = searchText.indexOf(searchKeyword, index);
      }

      if (position === -1) break;

      matches.push({
        keyword,
        position,
        length: keyword.length,
        matched: text.substr(position, keyword.length)
      });

      index = position + searchKeyword.length;
    }

    return matches;
  }

  /**
   * Escape special regex characters
   * @param {string} str - String to escape
   * @returns {string}
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Check if element contains matching keywords
   * @param {Element} element - DOM element to check
   * @returns {Object} Match result
   */
  matchElement(element) {
    if (!element) return { matched: false, keywords: [] };

    const text = element.innerText || element.textContent || '';
    return this.match(text);
  }

  /**
   * Highlight keywords in text (returns HTML string)
   * @param {string} text - Text to highlight
   * @param {string} highlightClass - CSS class for highlighting
   * @returns {string}
   */
  highlightMatches(text, highlightClass = 'keyword-highlight') {
    if (!text) return '';

    const matches = this.findAllMatches(text);

    if (matches.length === 0) return text;

    // Sort matches by position (descending) to replace from end to start
    matches.sort((a, b) => b.position - a.position);

    let result = text;

    for (const match of matches) {
      const before = result.substring(0, match.position);
      const matched = result.substring(match.position, match.position + match.length);
      const after = result.substring(match.position + match.length);

      result = `${before}<span class="${highlightClass}" data-keyword="${this.escapeHtml(match.keyword)}">${matched}</span>${after}`;
    }

    return result;
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string}
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Make available globally for content script
if (typeof window !== 'undefined') {
  window.KeywordMatcher = KeywordMatcher;
}
