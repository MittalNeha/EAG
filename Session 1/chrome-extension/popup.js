import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function Popup() {
  const [arxivTabs, setArxivTabs] = useState([]);

  useEffect(() => {
    chrome.storage.local.get({ arxivTabs: [] }, (result) => {
      setArxivTabs(result.arxivTabs);
    });
    // Listen for changes
    const listener = (changes, area) => {
      if (area === 'local' && changes.arxivTabs) {
        setArxivTabs(changes.arxivTabs.newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return (
    <div className="popup-container">
      <h2>📚 arXiv Papers Tracker</h2>
      <div className="paper-count">Tracking {arxivTabs.length} paper{arxivTabs.length !== 1 ? 's' : ''}</div>
      
      {arxivTabs.length === 0 ? (
        <div className="no-papers">No arXiv papers open. Visit an arXiv paper to start tracking!</div>
      ) : (
        <div className="papers-list">
          {arxivTabs.map(tab => (
            <div className="paper-card" key={tab.id}>
              <div className="paper-header">
                <h3 className="paper-title">{tab.paperTitle || tab.title}</h3>
                <div className="paper-id">arXiv:{tab.arxivId}</div>
              </div>
              
              <div className="paper-details">
                <div className="authors">👥 {tab.authors}</div>
                {tab.categories && <div className="categories">🏷️ {tab.categories}</div>}
                {tab.submissionDate && <div className="date">📅 {tab.submissionDate}</div>}
                {tab.wordCount > 0 && <div className="word-count">📝 {tab.wordCount} words</div>}
              </div>
              
              {tab.abstract && (
                <div className="abstract">
                  <strong>Abstract:</strong>
                  <p>{tab.abstract}</p>
                </div>
              )}
              
              <div className="paper-actions">
                <a href={tab.url} target="_blank" rel="noopener noreferrer" className="view-btn">
                  🔗 View Paper
                </a>
                {tab.pdfUrl && (
                  <a href={tab.pdfUrl} target="_blank" rel="noopener noreferrer" className="pdf-btn">
                    📄 PDF
                  </a>
                )}
                <button className="note-btn">📝 Notes</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<Popup />);
