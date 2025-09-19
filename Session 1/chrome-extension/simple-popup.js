// Simple popup script for arXiv paper tracker
function loadPapers() {
    chrome.storage.local.get({arxivTabs: []}, (result) => {
        const papers = result.arxivTabs;
        const container = document.getElementById('papers-container');
        const count = document.getElementById('paper-count');
        
        count.textContent = `Tracking ${papers.length} paper${papers.length !== 1 ? 's' : ''}`;
        
        if (papers.length === 0) {
            container.innerHTML = '<div class="no-papers">No arXiv papers open. Visit an arXiv paper to start tracking!</div>';
            return;
        }
        
        container.innerHTML = papers.map(paper => `
            <div class="paper-card">
                <div class="paper-title">${paper.paperTitle || paper.title}</div>
                <div class="paper-details">
                    <strong>Authors:</strong> ${paper.authors || 'Unknown'}<br>
                    ${paper.categories ? `<strong>Category:</strong> ${paper.categories}<br>` : ''}
                    ${paper.submissionDate ? `<strong>Date:</strong> ${paper.submissionDate}<br>` : ''}
                    ${paper.isHtmlVersion ? '<strong>Type:</strong> HTML Version<br>' : ''}
                </div>
                
                ${paper.aiAnalysis ? `
                    <div class="ai-analysis">
                        <div class="ai-header">🤖 AI Analysis</div>
                        <div class="ai-summary">
                            <strong>Summary:</strong> ${paper.aiAnalysis.summary}
                        </div>
                        <div class="ai-details">
                            <div class="ai-field"><strong>Field:</strong> ${paper.aiAnalysis.researchField}</div>
                            <div class="ai-complexity"><strong>Complexity:</strong> ${paper.aiAnalysis.complexity}</div>
                            <div class="ai-contributions"><strong>Contributions:</strong> ${paper.aiAnalysis.contributions}</div>
                        </div>
                        <div class="ai-key-terms">
                            <strong>Key Terms:</strong>
                            <div class="key-terms-list">
                                ${paper.aiAnalysis.keyTerms.map(term => `<span class="key-term">${term}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="ai-loading">
                        <div class="ai-header">🤖 AI Analysis</div>
                        <div class="loading-text">Analyzing paper with Gemini AI...</div>
                    </div>
                `}
                
                <div class="actions">
                    <a href="${paper.url}" target="_blank" class="btn">View Paper</a>
                    ${paper.pdfUrl ? `<a href="${paper.pdfUrl}" target="_blank" class="btn">PDF</a>` : ''}
                    <button class="btn" onclick="alert('Notes feature coming soon!')">Notes</button>
                </div>
            </div>
        `).join('');
    });
}

// Load papers on startup
document.addEventListener('DOMContentLoaded', () => {
    loadPapers();
    
    // Listen for changes
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.arxivTabs) {
            loadPapers();
        }
    });
    
    // Add a button to open persistent window
    addPersistentWindowButton();
});

function addPersistentWindowButton() {
    const header = document.querySelector('.header');
    const persistentBtn = document.createElement('button');
    persistentBtn.textContent = '📖 Open Persistent View';
    persistentBtn.className = 'btn persistent-btn';
    persistentBtn.style.marginTop = '10px';
    persistentBtn.style.width = '100%';
    persistentBtn.onclick = openPersistentWindow;
    header.appendChild(persistentBtn);
}

function openPersistentWindow() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('persistent-view.html'),
        active: true
    });
}
