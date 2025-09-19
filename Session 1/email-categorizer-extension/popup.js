// Email Categorizer Popup Script
class PopupController {
    constructor() {
        this.currentReport = null;
        this.currentCategory = null;
        this.setupEventListeners();
        this.updateDateDisplay();
        this.loadLastReport();
    }

    setupEventListeners() {
        document.getElementById('fetchEmailsBtn').addEventListener('click', () => {
            this.fetchEmails();
        });

        document.getElementById('refreshReportBtn').addEventListener('click', () => {
            this.refreshReport();
        });

        // Add click handlers for summary cards
        document.addEventListener('click', (e) => {
            if (e.target.closest('.summary-card')) {
                const category = e.target.closest('.summary-card').dataset.category;
                this.showCategoryDetails(category);
            }
        });
    }

    updateDateDisplay() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', options);
    }

    async fetchEmails() {
        this.setStatus('loading', 'Fetching emails...');
        
        try {
            const response = await this.sendMessage({ action: 'fetchEmails' });
            
            if (response.success) {
                this.setStatus('success', `Fetched ${response.count} emails`);
                this.currentReport = response.emails;
                this.displaySummaryCards(response.emails);
                this.updateEmailCount(response.count);
            } else {
                this.setStatus('error', `Error: ${response.error}`);
            }
        } catch (error) {
            this.setStatus('error', `Error: ${error.message}`);
        }
    }

    async refreshReport() {
        this.setStatus('loading', 'Refreshing report...');
        
        try {
            const response = await this.sendMessage({ action: 'getDailyReport' });
            
            if (response) {
                this.setStatus('success', 'Report refreshed');
                this.currentReport = response.report;
                this.displayReport(response.report);
                this.updateLastUpdated(response.lastUpdated);
            } else {
                this.setStatus('error', 'No report available');
            }
        } catch (error) {
            this.setStatus('error', `Error: ${error.message}`);
        }
    }

    async loadLastReport() {
        try {
            const response = await this.sendMessage({ action: 'getDailyReport' });
            if (response) {
                this.currentReport = response.report;
                this.displayReport(response.report);
                this.updateLastUpdated(response.lastUpdated);
            }
        } catch (error) {
            console.error('Error loading last report:', error);
        }
    }

    displaySummaryCards(emails) {
        const categories = this.categorizeEmails(emails);
        const totalEmails = emails.length;
        
        const cardsContainer = document.getElementById('summaryCards');
        cardsContainer.innerHTML = '';

        const categoryNames = {
            'account_maintenance': 'Account Maintenance',
            'newsletters': 'Newsletters',
            'trip_planning': 'Trip Planning',
            'redundant_info': 'Redundant Info',
            'uncategorized': 'Uncategorized'
        };

        const categoryColors = {
            'account_maintenance': '#FF9800',
            'newsletters': '#2196F3',
            'trip_planning': '#4CAF50',
            'redundant_info': '#9C27B0',
            'uncategorized': '#757575'
        };

        Object.entries(categories).forEach(([category, emails]) => {
            if (emails.length > 0) {
                const percentage = totalEmails > 0 ? Math.round((emails.length / totalEmails) * 100) : 0;
                
                const card = document.createElement('div');
                card.className = 'summary-card';
                card.dataset.category = category;
                card.style.borderLeft = `4px solid ${categoryColors[category]}`;
                
                card.innerHTML = `
                    <h3>${categoryNames[category]}</h3>
                    <div class="count">${emails.length}</div>
                    <div class="percentage">${percentage}%</div>
                `;
                
                cardsContainer.appendChild(card);
            }
        });
    }

    categorizeEmails(emails) {
        const categories = {
            'account_maintenance': [],
            'newsletters': [],
            'trip_planning': [],
            'redundant_info': [],
            'uncategorized': []
        };

        emails.forEach(email => {
            const category = email.category || 'uncategorized';
            if (categories[category]) {
                categories[category].push(email);
            } else {
                categories['uncategorized'].push(email);
            }
        });

        return categories;
    }

    displayReport(report) {
        const reportSection = document.getElementById('reportSection');
        const reportContent = document.getElementById('reportContent');
        
        if (!report || !report.categories) {
            reportContent.innerHTML = '<p>No report data available</p>';
            reportSection.style.display = 'block';
            return;
        }

        let html = `
            <div class="report-summary">
                <h3>📊 Summary</h3>
                <p>Total Emails: <strong>${report.totalEmails}</strong></p>
                <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
            </div>
        `;

        Object.entries(report.categories).forEach(([categoryKey, category]) => {
            if (category.count > 0) {
                html += `
                    <div class="category-summary">
                        <h4>${category.name} (${category.count} emails)</h4>
                        <div class="stats">
                            <span>Top Sender: ${category.topSenders[0]?.sender || 'N/A'}</span>
                            <span>Most Common: ${category.commonSubjects[0]?.subject || 'N/A'}</span>
                        </div>
                `;

                // Add subcategories for redundant_info
                if (categoryKey === 'redundant_info' && category.subcategories) {
                    Object.entries(category.subcategories).forEach(([subKey, subcategory]) => {
                        if (subcategory.count > 0) {
                            html += `
                                <div class="subcategory">
                                    <strong>${subcategory.name}:</strong> ${subcategory.count} emails
                                </div>
                            `;
                        }
                    });
                }

                html += '</div>';
            }
        });

        reportContent.innerHTML = html;
        reportSection.style.display = 'block';
    }

    showCategoryDetails(category) {
        if (!this.currentReport) return;

        const categorizedEmails = this.categorizeEmails(this.currentReport.emails || []);
        const emails = categorizedEmails[category] || [];

        const categoryDetails = document.getElementById('categoryDetails');
        const categoryTitle = document.getElementById('categoryTitle');
        const emailList = document.getElementById('emailList');

        const categoryNames = {
            'account_maintenance': 'Account Maintenance',
            'newsletters': 'Newsletters',
            'trip_planning': 'Trip Planning',
            'redundant_info': 'Redundant Info',
            'uncategorized': 'Uncategorized'
        };

        categoryTitle.textContent = `${categoryNames[category]} (${emails.length} emails)`;

        if (emails.length === 0) {
            emailList.innerHTML = '<p>No emails in this category</p>';
        } else {
            emailList.innerHTML = emails.map(email => `
                <div class="email-item" onclick="window.open('https://mail.google.com/mail/u/0/#inbox/${email.id}', '_blank')">
                    <div class="email-subject">${this.escapeHtml(email.subject || 'No Subject')}</div>
                    <div class="email-from">From: ${this.escapeHtml(email.from)}</div>
                    <div class="email-snippet">${this.escapeHtml(email.snippet || '')}</div>
                </div>
            `).join('');
        }

        categoryDetails.style.display = 'block';
        categoryDetails.scrollIntoView({ behavior: 'smooth' });
    }

    setStatus(type, message) {
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('statusText');
        
        indicator.className = `status-indicator ${type}`;
        text.textContent = message;
    }

    updateEmailCount(count) {
        document.getElementById('emailCount').textContent = `${count} emails today`;
    }

    updateLastUpdated(timestamp) {
        if (timestamp) {
            const date = new Date(timestamp);
            document.getElementById('lastUpdated').textContent = `Updated: ${date.toLocaleTimeString()}`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    sendMessage(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    }
}

// Initialize the popup controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});



