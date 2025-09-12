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
    <div>
      <h2>arXiv Papers in Tabs</h2>
      <ul className="arxiv-list">
        {arxivTabs.length === 0 && <li>No arXiv papers open.</li>}
        {arxivTabs.map(tab => (
          <li className="arxiv-item" key={tab.id}>
            <span className="arxiv-title">{tab.title}</span>
            <a href={tab.url} target="_blank" rel="noopener noreferrer">{tab.url}</a>
            <button className="note-btn">Open Notes</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<Popup />);
