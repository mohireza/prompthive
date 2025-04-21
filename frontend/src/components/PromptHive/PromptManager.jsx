import React, { useState } from 'react';
import { useEffect } from 'react';
import { promptHintLibraryService } from '../../services/promptHintLibraryService';

// Mock fetch function for demo purposes
const fetchPrompts = async (sheetId) => {
  // Replace this with an actual API call
  return promptHintLibraryService.getAllActivePrompts(sheetId)
};

const extractSheetIdFromLink = (link) => {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = link.match(regex);
    return match ? match[1] : null;
};

const deletePromptFromBackend = async (id) => {
  return promptHintLibraryService.deletePrompt(id);
};

const deleteAllPromptsFromBackend = async (sheetId) => {
  return promptHintLibraryService.deleteAllPrompts(sheetId);
};

const PromptManager = () => {
  const [sheetLink, setSheetLink] = useState('')
  const [sheetId, setSheetId] = useState('');
  const [prompts, setPrompts] = useState([]);
  const [revealedPrompts, setRevealedPrompts] = useState({});

  const handleFetchPrompts = async () => {
    const fetchedPrompts = await fetchPrompts(sheetId);
    setPrompts(fetchedPrompts);
  };

  useEffect(() => {
      setSheetId(extractSheetIdFromLink(sheetLink))
  })

  const toggleRevealPrompt = (id) => {
    setRevealedPrompts((prevState) => {
    console.log(prevState, id);
    return {
      ...prevState,
      [id]: !prevState[id],
      }
    })
  };

  const handleDeletePrompt = async (id) => {
    const response = await deletePromptFromBackend(id);
    if (response.status === 200) {
      await handleFetchPrompts();
    }
  };

  const handleDeleteAll = async () => {
    const success = await deleteAllPromptsFromBackend(sheetId);
    if (success) {
      handleFetchPrompts(sheetId)
    }
  };

  return (
    <div>
      <h1>Prompt Manager</h1>
      <input
        type="text"
        value={sheetId}
        onChange={(e) => setSheetLink(e.target.value)}
        placeholder="Enter sheet ID"
      />
      <button onClick={handleFetchPrompts}>Fetch Prompts</button>
      
      {prompts.length > 0 && (
        <div>
          <button onClick={handleDeleteAll}>Delete All</button>
          <ul>
            {prompts.map((p) => (
              <li key={p.id}>
                ID: {p.id}{' '}
                <button onClick={() => toggleRevealPrompt(p.id)}>
                  {revealedPrompts[p.id] ? 'Hide Details' : 'Reveal Details'}
                </button>{' '}
                <span
                  onClick={() => handleDeletePrompt(p.id)}
                  style={{ cursor: 'pointer', color: 'red', marginLeft: '10px' }}
                >
                  [Delete]
                </span>
                {revealedPrompts[p.id] && <p>{p.userId} {p.userMessages.map(m => m.content).join()}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PromptManager;
