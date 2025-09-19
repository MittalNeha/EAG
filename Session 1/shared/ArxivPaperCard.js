import React from 'react';

function ArxivPaperCard({ tab, onNoteClick }) {
  return (
    <div className="paper-card">
      <div className="paper-header">
        <h3 className="paper-title">{tab.paperTitle || tab.title}</h3>
        <div className="paper-id">arXiv:{tab.arxivId}</div>
      </div>
      <div className="paper-details">
        {tab.authors && <div className="authors">👥 {tab.authors}</div>}
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
        <button className="note-btn" onClick={() => onNoteClick(tab)}>📝 Notes</button>
      </div>
    </div>
  );
}

export default ArxivPaperCard;
