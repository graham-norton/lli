// LinkedIn Lead Finder - Background Service Worker

// Import Google Sheets service (will be loaded separately)
let googleSheetsService = null;

// State management
const state = {
  leads: [],
  exportQueue: [],
  isExporting: false,
  lastExport: null
};

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Initialize
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('LinkedIn Lead Finder installed/updated', details);

  if (details.reason === 'install') {
    // Set default settings
    await chrome.storage.sync.set({
      keywords: [],
      settings: {
        caseSensitive: false,
        wholeWord: false,
        autoSync: true,
        scanMode: 'auto',
        enableNotifications: true,
        highlightPosts: true,
        scanComments: false
      }
    });

    // Initialize stats
    await chrome.storage.local.set({
      stats: {
        totalLeads: 0,
        emailsFound: 0,
        phonesFound: 0,
        exportedCount: 0,
        lastSync: null
      },
      leads: []
    });

    console.log('Extension initialized with default settings');
  }
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  // Return true to indicate async response
  return true;
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      case 'NEW_LEAD':
        await handleNewLead(message.lead);
        sendResponse({ success: true });
        break;

      case 'AUTHENTICATE_GOOGLE':
        const authResult = await authenticateGoogle();
        sendResponse(authResult);
        break;

      case 'TEST_SHEET_CONNECTION':
        const testResult = await testSheetConnection();
        sendResponse(testResult);
        break;

      case 'EXPORT_NOW':
        const exportResult = await exportToSheets();
        sendResponse(exportResult);
        break;

      case 'STATS_UPDATED':
        // Forward stats update to popup if open
        notifyPopup(message);
        sendResponse({ success: true });
        break;

      case 'ASSESS_LEAD_RELEVANCE':
        const relevance = await assessLeadRelevance(message.lead, message.profile, message.model);
        sendResponse(relevance);
        break;
      case 'GENERATE_KEYWORDS':
        const keywordResult = await generateSearchKeywords(
          message.profile,
          message.existingKeywords,
          message.model
        );
        sendResponse(keywordResult);
        break;

      case 'AI_ANALYZE_HTML':
        const analysisResult = await analyzeHtmlWithAI(
          message.prompt,
          message.userGoal,
          message.pageUrl
        );
        sendResponse(analysisResult);
        break;

      case 'START_MULTI_KEYWORD_AI_TABS':
        startMultiKeywordAIWithTabs(
          message.userGoal,
          message.keywords,
          sender.tab?.id || null  // Safe access - sender.tab is undefined when called from popup
        ).then(result => {
          sendResponse(result);
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true;  // Async response

      case 'STOP_MULTI_KEYWORD_AI_TABS':
        stopMultiKeywordAIWithTabs();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleNewLead(lead) {
  console.log('New lead received:', lead);

  // Add to export queue
  state.exportQueue.push(lead);

  // Check if auto-sync is enabled
  const { settings } = await chrome.storage.sync.get(['settings']);

  if (settings && settings.autoSync) {
    // Export immediately or batch after a delay
    await scheduleExport();
  }

  // Show notification if enabled
  if (settings && settings.enableNotifications) {
    showNotification(lead);
  }
}

async function scheduleExport() {
  // Batch exports to avoid rate limiting
  // Wait for 5 seconds to collect more leads
  if (state.exportTimer) {
    clearTimeout(state.exportTimer);
  }

  state.exportTimer = setTimeout(async () => {
    if (state.exportQueue.length > 0 && !state.isExporting) {
      await exportToSheets();
    }
  }, 5000);
}

async function authenticateGoogle() {
  try {
    console.log('Starting Google authentication...');

    // Get OAuth token using Chrome Identity API
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          const message = lastError.message || 'Unknown authentication error';
          reject(new Error(message));
          return;
        }

        if (!token) {
          reject(new Error('Failed to receive auth token'));
          return;
        }

        resolve(token);
      });
    });

    // Save token
    await chrome.storage.local.set({ googleToken: token });

    console.log('Google authentication successful');
    return { success: true, token };

  } catch (error) {
    console.error('Google authentication failed:', error);
    return { success: false, error: error.message };
  }
}

async function testSheetConnection() {
  try {
    const { googleToken, sheetId } = await chrome.storage.local.get(['googleToken', 'sheetId']);

    if (!googleToken) {
      return { success: false, error: 'Not authenticated. Please connect your Google account.' };
    }

    if (!sheetId) {
      return { success: false, error: 'No sheet ID configured.' };
    }

    // Test API call
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
      {
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        await chrome.storage.local.remove(['googleToken']);
        return { success: false, error: 'Authentication expired. Please reconnect.' };
      }

      const error = await response.text();
      return { success: false, error: `API Error: ${error}` };
    }

    const data = await response.json();
    console.log('Sheet connection test successful:', data.properties.title);

    return {
      success: true,
      sheetName: data.properties.title
    };

  } catch (error) {
    console.error('Sheet connection test failed:', error);
    return { success: false, error: error.message };
  }
}

async function exportToSheets() {
  if (state.isExporting) {
    return { success: false, error: 'Export already in progress' };
  }

  try {
    state.isExporting = true;

    const { googleToken, sheetId } = await chrome.storage.local.get(['googleToken', 'sheetId']);

    if (!googleToken) {
      return { success: false, error: 'Not authenticated' };
    }

    if (!sheetId) {
      return { success: false, error: 'No sheet configured' };
    }

    // Get leads to export (from queue or all unexported)
    let leadsToExport = [];

    if (state.exportQueue.length > 0) {
      leadsToExport = state.exportQueue;
    } else {
      const { leads = [] } = await chrome.storage.local.get(['leads']);
      leadsToExport = leads.filter(lead => !lead.exported);
    }

    if (leadsToExport.length === 0) {
      return { success: true, count: 0, message: 'No new leads to export' };
    }

    console.log(`Exporting ${leadsToExport.length} leads...`);

    // Prepare data for Google Sheets
    const rows = leadsToExport.map(lead => [
      lead.timestamp,
      lead.postUrl || '',
      lead.authorName || '',
      lead.keywordMatched ? lead.keywordMatched.join(', ') : '',
      lead.postContent ? lead.postContent.substring(0, 500) : '', // Limit content length
      lead.emails ? lead.emails.join(', ') : '',
      lead.phones ? lead.phones.join(', ') : '',
      'New'
    ]);

    // Check if sheet has headers
    const hasHeaders = await checkSheetHeaders(googleToken, sheetId);

    if (!hasHeaders) {
      // Add headers first
      await appendToSheet(googleToken, sheetId, [[
        'Timestamp',
        'Post URL',
        'Author',
        'Keywords Matched',
        'Post Content',
        'Emails',
        'Phone Numbers',
        'Status'
      ]]);
    }

    // Append data
    await appendToSheet(googleToken, sheetId, rows);

    // Mark leads as exported
    const { leads = [] } = await chrome.storage.local.get(['leads']);
    leadsToExport.forEach(exportedLead => {
      const lead = leads.find(l => l.id === exportedLead.id);
      if (lead) {
        lead.exported = true;
        lead.exportedAt = new Date().toISOString();
      }
    });

    await chrome.storage.local.set({ leads });

    // Update stats
    const { stats } = await chrome.storage.local.get(['stats']);
    stats.exportedCount = (stats.exportedCount || 0) + leadsToExport.length;
    stats.lastSync = new Date().toISOString();
    await chrome.storage.local.set({ stats });

    // Clear export queue
    state.exportQueue = [];
    state.lastExport = new Date();

    console.log(`Successfully exported ${leadsToExport.length} leads`);

    return {
      success: true,
      count: leadsToExport.length
    };

  } catch (error) {
    console.error('Export failed:', error);
    return { success: false, error: error.message };
  } finally {
    state.isExporting = false;
  }
}

async function checkSheetHeaders(token, sheetId) {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:H1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) return false;

    const data = await response.json();
    return data.values && data.values.length > 0;

  } catch (error) {
    console.error('Error checking headers:', error);
    return false;
  }
}

async function appendToSheet(token, sheetId, rows) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1:append?valueInputOption=RAW`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: rows
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to append data: ${error}`);
  }

  return await response.json();
}

async function assessLeadRelevance(lead, profile = '', model = 'openrouter/openai/gpt-4o-mini') {
  try {
    const { openRouterKey } = await chrome.storage.local.get(['openRouterKey']);

    if (!openRouterKey) {
      return {
        relevant: true,
        reason: 'OpenRouter key not configured; skipping AI check'
      };
    }

    const prompt = `
Company / Lead Profile:
${profile || 'Not provided'}

LinkedIn Post:
Author: ${lead?.authorName || 'Unknown'}
Content:
${lead?.postContent || 'No content'}

Emails: ${(lead?.emails || []).join(', ') || 'None'}
Phones: ${(lead?.phones || []).join(', ') || 'None'}

Decide if this post represents a promising lead that matches the profile. Respond as JSON with keys "relevant" (boolean), "reason" (string under 200 chars), and optional "score" (0-1).`.trim();

    const body = {
      model: model || 'openrouter/openai/gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an assistant that qualifies LinkedIn posts as sales leads. Only return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter error: ${errorText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return {
        relevant: true,
        reason: 'Empty AI response; defaulting to relevant'
      };
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.warn('Failed to parse AI response, content:', content);
      return {
        relevant: true,
        reason: 'AI response not parseable; defaulting to relevant'
      };
    }

    return {
      relevant: parsed.relevant !== false,
      reason: parsed.reason || 'Qualified by AI',
      score: parsed.score
    };
  } catch (error) {
    console.error('OpenRouter relevance check failed:', error);
    return {
      relevant: true,
      reason: `AI error: ${error.message}`
    };
  }
}

async function generateSearchKeywords(profile = '', existingKeywords = [], preferredModel) {
  const trimmedProfile = (profile || '').trim();
  if (!trimmedProfile) {
    return { success: false, error: 'Company profile is required for AI keyword generation.' };
  }

  try {
    const { openRouterKey } = await chrome.storage.local.get(['openRouterKey']);
    if (!openRouterKey) {
      return { success: false, error: 'OpenRouter API key not configured.' };
    }

    const syncData = await chrome.storage.sync.get(['settings']);
    const fallbackModel = syncData.settings?.openRouterModel || 'openrouter/openai/gpt-4o-mini';
    const model = preferredModel || fallbackModel;

    const existingList = (existingKeywords || []).slice(0, 20).join(', ');
    const prompt = `
You are an expert LinkedIn sourcer helping a recruiter find leads.

Company / lead profile:
${trimmedProfile}

Existing keywords (avoid duplicates if possible):
${existingList || 'None'}

Return 5-10 concise LinkedIn search keyword phrases (no hashtags) focused on this profile. Include variations (job titles, pain points, hiring signals, industry keywords). Respond ONLY as JSON:
{
  "keywords": ["keyword one", "keyword two"]
}`.trim();

    const body = {
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You specialize in crafting LinkedIn search keywords. Only return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter error: ${text}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Empty response from OpenRouter');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new Error('AI response was not valid JSON');
    }

    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords.map(k => String(k).trim()).filter(Boolean)
      : [];

    if (keywords.length === 0) {
      throw new Error('AI did not return any keywords');
    }

    const uniqueKeywords = [...new Set(keywords)].slice(0, 12);

    return {
      success: true,
      keywords: uniqueKeywords
    };
  } catch (error) {
    console.error('Keyword generation failed:', error);
    return { success: false, error: error.message || 'Failed to generate keywords' };
  }
}

async function analyzeHtmlWithAI(prompt, userGoal, pageUrl) {
  try {
    const { openRouterKey } = await chrome.storage.local.get(['openRouterKey']);

    if (!openRouterKey) {
      return {
        success: false,
        error: 'OpenRouter API key not configured. Please add your API key in Settings.'
      };
    }

    // Get model preference
    const syncData = await chrome.storage.sync.get(['settings']);
    const model = syncData.settings?.openRouterModel || 'openrouter/openai/gpt-4o-mini';

    console.log('🤖 Sending HTML to AI for analysis...');
    console.log(`Model: ${model}`);
    console.log(`User goal: ${userGoal}`);

    const body = {
      model,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'You are a web scraping expert specializing in LinkedIn data extraction. Analyze HTML and generate precise extraction strategies. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': pageUrl || 'https://linkedin.com',
        'X-Title': 'LinkedIn Lead Finder'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Empty response from AI');
    }

    console.log('✅ AI analysis received');
    console.log('Response length:', content.length, 'chars');

    return {
      success: true,
      data: content
    };

  } catch (error) {
    console.error('AI HTML analysis failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze HTML with AI'
    };
  }
}

function showNotification(lead) {
  const hasContacts = (lead.emails && lead.emails.length > 0) ||
                      (lead.phones && lead.phones.length > 0);

  if (!hasContacts) return;

  const title = 'New Lead Found!';
  const message = `Found ${lead.emails?.length || 0} email(s) and ${lead.phones?.length || 0} phone(s) from ${lead.authorName}`;

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message,
    priority: 2
  });
}

function notifyPopup(message) {
  try {
    chrome.runtime.sendMessage(message, () => {
      // Suppress errors when no listeners (e.g., popup closed)
      void chrome.runtime.lastError;
    });
  } catch (error) {
    console.warn('Unable to notify popup:', error);
  }
}

// Helper function to send logs to logger page
function sendLog(message, level = 'info') {
  console.log(`[${level.toUpperCase()}] ${message}`);

  try {
    chrome.runtime.sendMessage({
      type: 'LOG',
      message: message,
      level: level
    }, () => {
      // Suppress errors when no listeners (e.g., logger not open)
      void chrome.runtime.lastError;
    });
  } catch (error) {
    // Silently fail if no listener
  }
}

// Multi-keyword AI with tabs state
let multiKeywordState = {
  active: false,
  userGoal: '',
  keywords: [],
  currentIndex: 0,
  currentTabId: null,
  originalTabId: null
};

async function startMultiKeywordAIWithTabs(userGoal, keywords, originalTabId) {
  sendLog('🚀 Starting multi-keyword AI with tabs approach', 'info');
  sendLog(`Keywords: ${keywords.length}, Goal: ${userGoal}`, 'info');

  multiKeywordState = {
    active: true,
    userGoal,
    keywords,
    currentIndex: 0,
    currentTabId: null,
    originalTabId
  };

  // Process first keyword
  await processNextKeywordInTab();

  return { success: true };
}

async function processNextKeywordInTab() {
  if (!multiKeywordState.active) {
    sendLog('Multi-keyword mode stopped', 'info');
    return;
  }

  if (multiKeywordState.currentIndex >= multiKeywordState.keywords.length) {
    sendLog('✅ All keywords processed!', 'success');
    await stopMultiKeywordAIWithTabs(true);
    return;
  }

  const keyword = multiKeywordState.keywords[multiKeywordState.currentIndex];
  sendLog(`🔍 Processing keyword ${multiKeywordState.currentIndex + 1}/${multiKeywordState.keywords.length}: "${keyword}"`, 'info');

  // Build LinkedIn search URL
  const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(keyword)}&origin=GLOBAL_SEARCH_HEADER`;

  try {
    // Create new tab
    const tab = await chrome.tabs.create({
      url: searchUrl,
      active: false  // Don't switch to the tab
    });

    multiKeywordState.currentTabId = tab.id;
    sendLog(`📑 Opened new tab ${tab.id} for keyword: ${keyword}`, 'info');

    // Wait for tab to load
    await waitForTabLoad(tab.id);
    sendLog(`✅ Tab ${tab.id} loaded`, 'success');

    // Wait additional time for LinkedIn to render AND content script to initialize
    sendLog('⏳ Waiting 12s for LinkedIn and content script to initialize...', 'info');
    await sleep(12000); // Increased from 8s to 12s

    // Try to send message with retries
    let response = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !response) {
      attempts++;
      sendLog(`🤖 Attempt ${attempts}/${maxAttempts}: Starting AI extraction in tab ${tab.id}`, 'info');

      try {
        response = await chrome.tabs.sendMessage(tab.id, {
          type: 'EXTRACT_IN_TAB',
          userGoal: multiKeywordState.userGoal,
          keyword: keyword
        });

        if (response && response.success) {
          sendLog(`✅ Extracted ${response.count || 0} items from keyword: ${keyword}`, 'success');
          break;
        } else {
          sendLog(`⚠️ Response but no success for keyword: ${keyword}`, 'warning');
          if (attempts < maxAttempts) {
            sendLog('Waiting 3s before retry...', 'info');
            await sleep(3000);
          }
        }
      } catch (error) {
        sendLog(`❌ Error sending message (attempt ${attempts}): ${error.message}`, 'error');
        if (attempts < maxAttempts) {
          sendLog('Waiting 3s before retry...', 'info');
          await sleep(3000);
        } else {
          throw error;
        }
      }
    }

    // Close the tab
    await chrome.tabs.remove(tab.id);
    sendLog(`🗑️ Closed tab ${tab.id}`, 'info');

    // Wait before next keyword (configurable delay)
    const settings = await chrome.storage.sync.get(['settings']);
    const delay = settings.settings?.autoSearchDelay || 5000;
    await sleep(delay);

    // Move to next keyword
    multiKeywordState.currentIndex++;
    await processNextKeywordInTab();

  } catch (error) {
    sendLog(`❌ Error processing keyword "${keyword}": ${error.message}`, 'error');
    sendLog(`Full error stack: ${error.stack}`, 'error');

    // Try to close tab if it exists
    if (multiKeywordState.currentTabId) {
      try {
        await chrome.tabs.remove(multiKeywordState.currentTabId);
        sendLog('Tab closed after error', 'info');
      } catch (e) {
        sendLog(`Error closing tab: ${e.message}`, 'error');
      }
    }

    // Continue to next keyword despite error
    sendLog('Moving to next keyword despite error...', 'warning');
    multiKeywordState.currentIndex++;
    await processNextKeywordInTab();
  }
}

async function stopMultiKeywordAIWithTabs(completed = false) {
  console.log('⏹️ Stopping multi-keyword AI with tabs');

  // Close current tab if open
  if (multiKeywordState.currentTabId) {
    try {
      await chrome.tabs.remove(multiKeywordState.currentTabId);
    } catch (error) {
      // Tab might already be closed
    }
  }

  multiKeywordState = {
    active: false,
    userGoal: '',
    keywords: [],
    currentIndex: 0,
    currentTabId: null,
    originalTabId: null
  };

  // Notify popup
  notifyPopup({
    type: 'MULTI_KEYWORD_TABS_STOPPED',
    completed: completed
  });

  return { success: true };
}

function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    const listener = (updatedTabId, changeInfo, tab) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);

    // Timeout after 30 seconds
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 30000);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Alarm for periodic sync (optional)
if (chrome?.alarms?.create) {
  chrome.alarms.create('periodicSync', {
    periodInMinutes: 30
  });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'periodicSync') {
      const { settings } = await chrome.storage.sync.get(['settings']);

      if (settings && settings.autoSync) {
        await exportToSheets();
      }
    }
  });
} else {
  console.warn('Chrome alarms API unavailable; periodic sync disabled.');
}

console.log('Background service worker initialized');
