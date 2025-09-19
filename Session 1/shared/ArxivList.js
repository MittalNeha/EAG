import React from 'react';

function ArxivList({ arxivLinks, onNoteClick }) {
  return (
    <ul className="arxiv-list">
      {arxivLinks.length === 0 && <li>No arXiv papers added.</li>}
      {arxivLinks.map((tab, idx) => (
        <li className="arxiv-item" key={idx}>
          <span className="arxiv-title">{tab.title}</span>
          <a href={tab.url} target="_blank" rel="noopener noreferrer">{tab.url}</a>
          <button className="note-btn" onClick={() => onNoteClick(tab)}>Open Notes</button>
        </li>
      ))}
    </ul>
  );
}

export default ArxivList;
