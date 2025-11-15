// Contact Information Extractor
class ContactExtractor {
  constructor() {
    // Email regex pattern
    this.emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    // Phone number patterns (multiple formats)
    this.phoneRegexes = [
      // US format: (123) 456-7890, 123-456-7890, 123.456.7890
      /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      // International format: +1234567890, +12 345 678 90
      /\+?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
      // Other formats: 1234567890
      /\b\d{10,15}\b/g
    ];

    // Common false positive patterns to filter
    this.emailBlacklist = [
      'example.com',
      'test.com',
      'domain.com',
      'email.com',
      'yourcompany.com',
      'youremail.com',
      'company.com',
      'noreply@',
      'no-reply@'
    ];

    // Common false positive phone patterns
    this.phoneBlacklist = [
      '1234567890',
      '0000000000',
      '1111111111'
    ];
  }

  /**
   * Extract emails from text
   * @param {string} text - Text to extract from
   * @returns {Array<string>} Array of unique emails
   */
  extractEmails(text) {
    if (!text) return [];

    const emails = text.match(this.emailRegex) || [];
    const uniqueEmails = [...new Set(emails)];

    // Filter out false positives
    return uniqueEmails.filter(email => {
      const lowerEmail = email.toLowerCase();

      // Check against blacklist
      if (this.emailBlacklist.some(pattern => lowerEmail.includes(pattern))) {
        return false;
      }

      // Additional validation
      return this.isValidEmail(email);
    });
  }

  /**
   * Extract phone numbers from text
   * @param {string} text - Text to extract from
   * @returns {Array<string>} Array of unique phone numbers
   */
  extractPhones(text) {
    if (!text) return [];

    let phones = [];

    // Try all regex patterns
    this.phoneRegexes.forEach(regex => {
      const matches = text.match(regex) || [];
      phones.push(...matches);
    });

    // Clean and deduplicate
    phones = phones.map(phone => this.cleanPhone(phone));
    const uniquePhones = [...new Set(phones)];

    // Filter out false positives
    return uniquePhones.filter(phone => {
      // Check against blacklist
      if (this.phoneBlacklist.includes(phone.replace(/\D/g, ''))) {
        return false;
      }

      // Additional validation
      return this.isValidPhone(phone);
    });
  }

  /**
   * Extract both emails and phones from text
   * @param {string} text - Text to extract from
   * @returns {Object} Object with emails and phones arrays
   */
  extractAll(text) {
    return {
      emails: this.extractEmails(text),
      phones: this.extractPhones(text)
    };
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  isValidEmail(email) {
    // Basic validation
    if (!email || email.length < 6 || email.length > 254) {
      return false;
    }

    // Must have @ and .
    if (!email.includes('@') || !email.includes('.')) {
      return false;
    }

    // Split into parts
    const parts = email.split('@');
    if (parts.length !== 2) {
      return false;
    }

    const [local, domain] = parts;

    // Validate local part
    if (!local || local.length > 64) {
      return false;
    }

    // Validate domain
    if (!domain || domain.length < 4) {
      return false;
    }

    // Domain must have at least one dot
    if (!domain.includes('.')) {
      return false;
    }

    // TLD must be at least 2 characters
    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2) {
      return false;
    }

    return true;
  }

  /**
   * Validate phone number
   * @param {string} phone - Phone to validate
   * @returns {boolean}
   */
  isValidPhone(phone) {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');

    // Must be between 10 and 15 digits
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return false;
    }

    // Check for repeated digits (e.g., 1111111111)
    if (/^(\d)\1+$/.test(digitsOnly)) {
      return false;
    }

    return true;
  }

  /**
   * Clean phone number
   * @param {string} phone - Phone to clean
   * @returns {string}
   */
  cleanPhone(phone) {
    // Remove extra spaces and normalize
    return phone.trim().replace(/\s+/g, ' ');
  }

  /**
   * Extract contacts from DOM element
   * @param {Element} element - DOM element to extract from
   * @returns {Object} Extracted contacts
   */
  extractFromElement(element) {
    if (!element) return { emails: [], phones: [] };

    const text = element.innerText || element.textContent || '';
    return this.extractAll(text);
  }
}

// Make available globally for content script
if (typeof window !== 'undefined') {
  window.ContactExtractor = ContactExtractor;
}
