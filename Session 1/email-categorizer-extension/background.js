// Email Categorizer Background Script
class EmailCategorizer {
  constructor() {
    this.categories = {
      'account_maintenance': {
        name: 'Account Maintenance',
        keywords: ['password', 'security', 'verification', 'account', 'login', 'signin', 'reset', 'confirm', 'verify', 'unlock', 'suspended', 'billing', 'subscription', 'payment', 'invoice', 'receipt'],
        domains: ['noreply', 'no-reply', 'security', 'billing', 'accounts', 'support']
      },
      'newsletters': {
        name: 'Newsletters',
        keywords: ['newsletter', 'digest', 'weekly', 'daily', 'monthly', 'update', 'news', 'blog', 'subscribe', 'unsubscribe', 'marketing', 'promotion', 'offer', 'deal', 'sale'],
        domains: ['newsletter', 'digest', 'blog', 'news', 'updates', 'marketing']
      },
      'trip_planning': {
        name: 'Trip Planning',
        keywords: ['flight', 'hotel', 'booking', 'reservation', 'travel', 'trip', 'vacation', 'airline', 'airport', 'check-in', 'boarding', 'itinerary', 'destination', 'tourism', 'car rental', 'uber', 'lyft'],
        domains: ['booking', 'expedia', 'airbnb', 'hotels', 'airlines', 'travel', 'trip', 'kayak', 'priceline']
      },
      'redundant_info': {
        name: 'Redundant Info',
        subcategories: {
          'bank_debits': {
            name: 'Bank Account Debits',
            keywords: ['debit', 'withdrawal', 'payment', 'transaction', 'balance', 'account', 'bank', 'atm', 'transfer', 'deposit', 'statement', 'alert', 'notification'],
            domains: ['bank', 'chase', 'wells', 'bofa', 'citi', 'capitalone', 'discover', 'usaa', 'pnc']
          },
          'investments': {
            name: 'Investments & Mutual Funds',
            keywords: ['investment', 'portfolio', 'mutual fund', 'etf', 'stock', 'bond', 'dividend', 'capital gains', 'roth', 'ira', '401k', 'retirement', 'fidelity', 'vanguard', 'schwab', 'robinhood'],
            domains: ['fidelity', 'vanguard', 'schwab', 'robinhood', 'etrade', 'ameritrade', 'investment', 'finance']
          }
        }
      }
    };
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'fetchEmails') {
        this.fetchTodayEmails().then(sendResponse);
        return true; // Keep message channel open for async response
      } else if (request.action === 'getDailyReport') {
        this.getDailyReport().then(sendResponse);
        return true;
      } else if (request.action === 'categorizeEmails') {
        this.categorizeEmails(request.emails).then(sendResponse);
        return true;
      }
    });

    // Auto-fetch emails every hour
    try {
      chrome.alarms.create('fetchEmails', { periodInMinutes: 60 });
      chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'fetchEmails') {
          this.fetchTodayEmails();
        }
      });
    } catch (error) {
      console.log('Alarms API not available:', error);
    }
  }

  async fetchTodayEmails() {
    try {
      // Check if we have a valid access token
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available. Please authenticate.');
      }

      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Format for Gmail API
      const query = `after:${Math.floor(startOfDay.getTime() / 1000)} before:${Math.floor(endOfDay.getTime() / 1000)}`;

      // Fetch email list
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status}`);
      }

      const data = await response.json();
      const emails = [];

      // Fetch detailed information for each email
      for (const message of data.messages || []) {
        try {
          const emailDetail = await this.fetchEmailDetails(message.id, token);
          if (emailDetail) {
            emails.push(emailDetail);
          }
        } catch (error) {
          console.error(`Error fetching email ${message.id}:`, error);
        }
      }

      // Categorize emails
      const categorizedEmails = await this.categorizeEmails(emails);

      // Store in local storage
      await this.storeEmails(categorizedEmails);

      return {
        success: true,
        emails: categorizedEmails,
        count: emails.length
      };

    } catch (error) {
      console.error('Error fetching emails:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async fetchEmailDetails(messageId, token) {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch email details: ${response.status}`);
    }

    const message = await response.json();
    
    // Extract email data
    const headers = message.payload.headers;
    const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    return {
      id: messageId,
      subject: getHeader('subject'),
      from: getHeader('from'),
      to: getHeader('to'),
      date: getHeader('date'),
      snippet: message.snippet,
      threadId: message.threadId,
      labels: message.labelIds || [],
      sizeEstimate: message.sizeEstimate,
      timestamp: new Date(getHeader('date')).getTime()
    };
  }

  async categorizeEmails(emails) {
    return emails.map(email => {
      const category = this.categorizeEmail(email);
      return {
        ...email,
        category: category.category,
        subcategory: category.subcategory,
        confidence: category.confidence
      };
    });
  }

  categorizeEmail(email) {
    const subject = (email.subject || '').toLowerCase();
    const from = (email.from || '').toLowerCase();
    const snippet = (email.snippet || '').toLowerCase();
    const text = `${subject} ${snippet}`;

    let bestMatch = { category: 'uncategorized', subcategory: null, confidence: 0 };

    // Check each category
    for (const [categoryKey, category] of Object.entries(this.categories)) {
      if (categoryKey === 'redundant_info') {
        // Handle redundant info subcategories
        for (const [subKey, subcategory] of Object.entries(category.subcategories)) {
          const score = this.calculateScore(text, from, subcategory);
          if (score > bestMatch.confidence) {
            bestMatch = {
              category: categoryKey,
              subcategory: subKey,
              confidence: score
            };
          }
        }
      } else {
        const score = this.calculateScore(text, from, category);
        if (score > bestMatch.confidence) {
          bestMatch = {
            category: categoryKey,
            subcategory: null,
            confidence: score
          };
        }
      }
    }

    return bestMatch;
  }

  calculateScore(text, from, category) {
    let score = 0;
    
    // Check keywords
    for (const keyword of category.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    // Check domain patterns
    for (const domain of category.domains) {
      if (from.includes(domain.toLowerCase())) {
        score += 2; // Domain matches are weighted higher
      }
    }

    // Normalize score (max possible score is roughly 10-15)
    return Math.min(score / 10, 1);
  }

  async storeEmails(emails) {
    const today = new Date().toDateString();
    const storageKey = `emails_${today}`;
    
    await chrome.storage.local.set({
      [storageKey]: {
        date: today,
        emails: emails,
        lastUpdated: Date.now()
      }
    });

    // Also store in daily reports
    await this.updateDailyReport(emails);
  }

  async updateDailyReport(emails) {
    const today = new Date().toDateString();
    const report = await this.generateDailyReport(emails);
    
    await chrome.storage.local.set({
      [`daily_report_${today}`]: {
        date: today,
        report: report,
        lastUpdated: Date.now()
      }
    });
  }

  async generateDailyReport(emails) {
    const categories = {};
    let totalEmails = emails.length;

    // Initialize categories
    for (const [key, category] of Object.entries(this.categories)) {
      categories[key] = {
        name: category.name,
        count: 0,
        emails: [],
        subcategories: {}
      };
      
      if (key === 'redundant_info') {
        for (const [subKey, subcategory] of Object.entries(category.subcategories)) {
          categories[key].subcategories[subKey] = {
            name: subcategory.name,
            count: 0,
            emails: []
          };
        }
      }
    }

    // Categorize emails
    emails.forEach(email => {
      const categoryKey = email.category;
      if (categories[categoryKey]) {
        categories[categoryKey].count++;
        categories[categoryKey].emails.push(email);
        
        if (email.subcategory && categories[categoryKey].subcategories[email.subcategory]) {
          categories[categoryKey].subcategories[email.subcategory].count++;
          categories[categoryKey].subcategories[email.subcategory].emails.push(email);
        }
      }
    });

    // Generate summaries
    const summaries = {};
    for (const [key, category] of Object.entries(categories)) {
      if (category.count > 0) {
        summaries[key] = this.generateCategorySummary(category);
      }
    }

    return {
      totalEmails,
      categories,
      summaries,
      generatedAt: new Date().toISOString()
    };
  }

  generateCategorySummary(category) {
    const emails = category.emails;
    const topSenders = this.getTopSenders(emails);
    const commonSubjects = this.getCommonSubjects(emails);
    
    return {
      count: category.count,
      topSenders: topSenders.slice(0, 3),
      commonSubjects: commonSubjects.slice(0, 3),
      subcategories: category.subcategories
    };
  }

  getTopSenders(emails) {
    const senderCount = {};
    emails.forEach(email => {
      const sender = email.from.split('<')[0].trim() || email.from;
      senderCount[sender] = (senderCount[sender] || 0) + 1;
    });
    
    return Object.entries(senderCount)
      .sort(([,a], [,b]) => b - a)
      .map(([sender, count]) => ({ sender, count }));
  }

  getCommonSubjects(emails) {
    const subjectCount = {};
    emails.forEach(email => {
      const subject = email.subject || 'No Subject';
      subjectCount[subject] = (subjectCount[subject] || 0) + 1;
    });
    
    return Object.entries(subjectCount)
      .sort(([,a], [,b]) => b - a)
      .map(([subject, count]) => ({ subject, count }));
  }

  async getDailyReport() {
    const today = new Date().toDateString();
    const result = await chrome.storage.local.get([`daily_report_${today}`]);
    return result[`daily_report_${today}`] || null;
  }

  async getAccessToken() {
    // First try to get stored token
    const stored = await chrome.storage.local.get(['gmail_access_token', 'token_expires_at']);
    
    if (stored.gmail_access_token && stored.token_expires_at && Date.now() < stored.token_expires_at) {
      return stored.gmail_access_token;
    }
    
    // If no valid token, open auth page
    return new Promise((resolve, reject) => {
      chrome.tabs.create({ url: chrome.runtime.getURL('auth.html') }, (tab) => {
        // Listen for auth success message
        const listener = (message, sender, sendResponse) => {
          if (message.action === 'auth_success') {
            chrome.runtime.onMessage.removeListener(listener);
            chrome.tabs.remove(tab.id);
            
            // Get the stored token
            chrome.storage.local.get(['gmail_access_token'], (result) => {
              if (result.gmail_access_token) {
                resolve(result.gmail_access_token);
              } else {
                reject(new Error('Authentication failed'));
              }
            });
          }
        };
        
        chrome.runtime.onMessage.addListener(listener);
        
        // Timeout after 5 minutes
        setTimeout(() => {
          chrome.runtime.onMessage.removeListener(listener);
          chrome.tabs.remove(tab.id);
          reject(new Error('Authentication timeout'));
        }, 300000);
      });
    });
  }
}

// Initialize the email categorizer
const emailCategorizer = new EmailCategorizer();
