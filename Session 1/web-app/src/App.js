import React, { useState } from 'react';
import ArxivList from '../../shared/ArxivList';

function App() {
  const [arxivLinks, setArxivLinks] = useState([]);
  const [newLink, setNewLink] = useState('');

  const addLink = () => {
    if (newLink && newLink.includes('arxiv.org/abs/')) {
      setArxivLinks([...arxivLinks, { url: newLink, title: newLink }]);
      setNewLink('');
    }
  };

  const handleNoteClick = (tab) => {
    alert(`Open notes for: ${tab.title}`);
  };

  return (
    <div>
      <h2>arXiv Papers</h2>
      <input
        type="text"
        value={newLink}
        onChange={e => setNewLink(e.target.value)}
        placeholder="Paste arXiv link here"
        style={{ width: '70%', marginRight: 8 }}
      />
      <button className="note-btn" onClick={addLink}>Add</button>
      <ArxivList arxivLinks={arxivLinks} onNoteClick={handleNoteClick} />
    </div>
  );
}

export default App;
