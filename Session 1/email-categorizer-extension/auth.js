// Authentication script for Gmail OAuth
// You'll need to replace this with your new Web Application Client ID
const CLIENT_ID = '784076312733-98rkee37ltfkb7a49j2csm0gdg0mh0h7.apps.googleusercontent.com';
const REDIRECT_URI = chrome.runtime.getURL('redirect.html');
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.getElementById('authButton');
    const status = document.getElementById('status');
    
    authButton.addEventListener('click', () => {
        // Open the local server page for OAuth
        chrome.tabs.create({ 
            url: chrome.runtime.getURL('local-server.html') 
        });
        
        showStatus('Please complete authentication in the new tab, then return here.', 'info');
        
        // Check for token periodically
        const checkForToken = setInterval(() => {
            chrome.storage.local.get(['gmail_access_token'], (result) => {
                if (result.gmail_access_token) {
                    clearInterval(checkForToken);
                    showStatus('Authentication successful! You can now close this tab.', 'success');
                    chrome.runtime.sendMessage({ action: 'auth_success' });
                }
            });
        }, 2000);
        
        // Stop checking after 5 minutes
        setTimeout(() => {
            clearInterval(checkForToken);
        }, 300000);
    });
    
    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
    }
});
