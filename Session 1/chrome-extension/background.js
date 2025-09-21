// arXiv Paper Tracker Background Script with Gemini AI

// Gemini AI configuration
const GEMINI_API_KEY = 'AIzaSyAwbRKQBrc8HPwpzIKlBFv7XvjiZXdl-3o';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Function to analyze paper with Gemini AI
async function analyzeWithGemini(abstract, paperTitle) {
  try {
    const prompt = `
Analyze this research paper abstract and provide:

1. A concise 2-3 sentence summary
2. Top 5 key terms that describe the main concepts
3. Research field/category
4. Technical complexity level (Beginner/Intermediate/Advanced)
5. Main research contributions

Paper Title: "${paperTitle}"
Abstract: "${abstract}"

Format your response as JSON:
{
  "summary": "Brief summary here",
  "keyTerms": ["term1", "term2", "term3", "term4", "term5"],
  "researchField": "Field name",
  "complexity": "Beginner/Intermediate/Advanced",
  "contributions": "Main contributions here"
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini AI response:', response);
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Try to parse JSON response
    try {
      //aiResponse.replace(/```json|```/g, '').trim();
      console.log('Gemini AI response:', aiResponse);
      return JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
    } catch (parseError) {
      console.error('Catch of JSON parsing of Gemini AI response:', parseError);
      // Fallback if JSON parsing fails
      return {
        summary: aiResponse.summary, //.substring(0, 200) + "...",
        keyTerms: ["AI", "Research", "Technology"],
        researchField: "Computer Science",
        complexity: "Intermediate",
        contributions: data //"Novel research contributions"
      };
    }
  } catch (error) {
    console.error('Gemini AI error:', error);
    return {
      summary: "AI analysis unavailable",
      keyTerms: ["Analysis", "Failed"],
      researchField: "Unknown",
      complexity: "Unknown",
      contributions: "Unable to analyze"
    };
  }
}
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && (tab.url.includes('arxiv.org/abs/') || tab.url.includes('arxiv.org/html/')) && changeInfo.status === 'complete') {
    // Extract paper details from the page
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: extractPaperDetails
    }, (results) => {
      if (results && results[0] && results[0].result) {
        const paperData = results[0].result;
        
        chrome.storage.local.get({arxivTabs: []}, async (result) => {
          let arxivTabs = result.arxivTabs;
          
          // Check if this tab is already tracked
          const existingIndex = arxivTabs.findIndex(t => t.id === tabId);
          
          const paperEntry = {
            id: tabId,
            url: tab.url,
            title: tab.title || tab.url,
            ...paperData,
            lastUpdated: Date.now(),
            aiAnalysis: null // Will be populated by AI
          };
          
          if (existingIndex >= 0) {
            // Update existing entry
            arxivTabs[existingIndex] = paperEntry;
          } else {
            // Add new entry
            arxivTabs.push(paperEntry);
          }
          
          chrome.storage.local.set({arxivTabs});
          
          // Analyze with Gemini AI in the background
          if (paperData.abstract && paperData.abstract.length > 50) {
            try {
              const aiAnalysis = await analyzeWithGemini(paperData.abstract, paperData.paperTitle || tab.title);
              
              // Update the paper with AI analysis
              const updatedTabs = arxivTabs.map(tab => 
                tab.id === tabId 
                  ? { ...tab, aiAnalysis, lastAnalyzed: Date.now() }
                  : tab
              );
              
              chrome.storage.local.set({arxivTabs: updatedTabs});
            } catch (error) {
              console.error('AI analysis failed:', error);
            }
          }
        });
      }
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get({arxivTabs: []}, (result) => {
    let arxivTabs = result.arxivTabs.filter(t => t.id !== tabId);
    chrome.storage.local.set({arxivTabs});
  });
});

// Function to extract paper details from arXiv page
function extractPaperDetails() {
  try {
    let title, authors, abstract, arxivId, submissionDate, categories, pdfUrl;
    
    // Check if this is an HTML version or abstract version
    const isHtmlVersion = window.location.href.includes('/html/');
    
    if (isHtmlVersion) {
      // HTML version structure
      title = document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : document.title;
      
      // Look for authors in various possible locations
      const authorElements = document.querySelectorAll('p, div');
      let authorText = '';
      for (let el of authorElements) {
        const text = el.textContent.trim();
        if (text.includes('@') && text.includes('.ac.uk') || text.includes('.edu')) {
          authorText = text;
          break;
        }
      }
      authors = authorText || 'Unknown';
      
      // Extract abstract - look for the abstract section
      const abstractHeader = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .find(h => h.textContent.toLowerCase().includes('abstract'));
      
      if (abstractHeader) {
        const abstractElement = abstractHeader.nextElementSibling;
        abstract = abstractElement ? abstractElement.textContent.trim() : '';
      } else {
        // Fallback: look for any paragraph that might be an abstract
        const paragraphs = document.querySelectorAll('p');
        for (let p of paragraphs) {
          const text = p.textContent.trim();
          if (text.length > 100 && text.toLowerCase().includes('generative')) {
            abstract = text;
            break;
          }
        }
      }
      
      // Extract arXiv ID from URL
      arxivId = window.location.pathname.split('/').pop();
      
      // Look for date information
      const dateText = document.body.textContent.match(/\d{1,2}\s+\w+\s+\d{4}/);
      submissionDate = dateText ? dateText[0] : '';
      
      // Look for categories
      const categoryText = document.body.textContent.match(/arXiv:\d+\.\d+v\d+\s*\[([^\]]+)\]/);
      categories = categoryText ? categoryText[1] : '';
      
      // Look for PDF link
      const pdfLink = document.querySelector('a[href*=".pdf"]') || 
                     document.querySelector('a[href*="pdf"]');
      pdfUrl = pdfLink ? pdfLink.href : '';
      
    } else {
      // Abstract version structure (original code)
      const titleElement = document.querySelector('h1.title');
      title = titleElement ? titleElement.textContent.trim() : document.title;
      
      const authorsElement = document.querySelector('.authors');
      authors = authorsElement ? authorsElement.textContent.trim() : 'Unknown';
      
      const abstractElement = document.querySelector('blockquote.abstract');
      abstract = abstractElement ? abstractElement.textContent.trim() : '';
      
      arxivId = window.location.pathname.split('/').pop();
      
      const dateElement = document.querySelector('.dateline');
      submissionDate = dateElement ? dateElement.textContent.trim() : '';
      
      const categoriesElement = document.querySelector('.primary-subject');
      categories = categoriesElement ? categoriesElement.textContent.trim() : '';
      
      const pdfLink = document.querySelector('a[href$=".pdf"]');
      pdfUrl = pdfLink ? pdfLink.href : '';
    }
    
    return {
      paperTitle: title,
      authors: authors,
      abstract: abstract.substring(0, 500) + (abstract.length > 500 ? '...' : ''),
      arxivId: arxivId,
      submissionDate: submissionDate,
      categories: categories,
      pdfUrl: pdfUrl,
      wordCount: abstract.split(' ').length,
      isHtmlVersion: isHtmlVersion
    };
  } catch (error) {
    console.error('Error extracting paper details:', error);
    return {
      paperTitle: document.title,
      authors: 'Unknown',
      abstract: '',
      arxivId: window.location.pathname.split('/').pop(),
      submissionDate: '',
      categories: '',
      pdfUrl: '',
      wordCount: 0,
      isHtmlVersion: window.location.href.includes('/html/')
    };
  }
}
