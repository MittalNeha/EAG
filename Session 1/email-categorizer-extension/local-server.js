// Local server OAuth handling script
const CLIENT_ID = '784076312733-98rkee37ltfkb7a49j2csm0gdg0mh0h7.apps.googleusercontent.com';
const REDIRECT_URI = 'http://localhost:8080';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.getElementById('authButton');
    const status = document.getElementById('status');
    
    authButton.addEventListener('click', () => {
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${CLIENT_ID}&` +
            `response_type=token&` +
            `scope=${encodeURIComponent(SCOPES)}&` +
            `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
            `access_type=offline&` +
            `prompt=consent`;
        
        // Open in same window
        window.location.href = authUrl;
    });
    
    // Check if we're returning from OAuth
    const hash = window.location.hash;
    const accessToken = hash.match(/access_token=([^&]+)/);
    
    if (accessToken) {
        // Store token in Chrome storage
        chrome.storage.local.set({
            gmail_access_token: accessToken[1],
            token_expires_at: Date.now() + (3600 * 1000)
        }, () => {
            status.innerHTML = `
                <div class="success">
                    <h3>✅ Authentication Successful!</h3>
                    <p>Token stored. You can now close this tab and use the extension.</p>
                    <p>Click the extension icon in Chrome to start categorizing emails.</p>
                </div>
            `;
            status.style.display = 'block';
        });
    } else {
        const error = hash.match(/error=([^&]+)/);
        if (error) {
            status.innerHTML = `
                <div class="error">
                    <h3>❌ Authentication Failed</h3>
                    <p>Error: ${error[1]}</p>
                </div>
            `;
            status.style.display = 'block';
        }
    }
});


