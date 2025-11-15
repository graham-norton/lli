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
