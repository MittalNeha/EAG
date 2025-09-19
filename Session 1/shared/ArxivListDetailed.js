import React from 'react';
import ArxivPaperCard from './ArxivPaperCard';

function ArxivListDetailed({ arxivTabs, onNoteClick }) {
  if (!arxivTabs || arxivTabs.length === 0) {
    return <div className="no-papers">No arXiv papers open. Visit an arXiv paper to start tracking!</div>;
  }
  return (
    <div className="papers-list">
      {arxivTabs.map(tab => (
        <ArxivPaperCard key={tab.id || tab.url} tab={tab} onNoteClick={onNoteClick} />
      ))}
    </div>
  );
}

export default ArxivListDetailed;
