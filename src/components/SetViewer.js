import React, { useState, useEffect } from 'react';
import ExportModal from './ExportModal';
import BackToTop from './BackToTop';

const SetViewer = ({ set, onBack, onUpdateSet, onDeleteSet, viewMode, onViewModeChange, searchTerm, onSearchChange }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [editingField, setEditingField] = useState(null); // 'word', 'translation', 'sentence', etc.
  const [editingValue, setEditingValue] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSet, setOriginalSet] = useState(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [isCreatingNewCard, setIsCreatingNewCard] = useState(false);
  const [aiGenerationOptions, setAiGenerationOptions] = useState({});

  // Track original state for change detection
  useEffect(() => {
    if (!originalSet) {
      setOriginalSet(JSON.parse(JSON.stringify(set)));
    }
  }, [set, originalSet]);

  // Detect changes
  useEffect(() => {
    if (originalSet) {
      const hasChanges = JSON.stringify(set) !== JSON.stringify(originalSet);
      setHasUnsavedChanges(hasChanges);
    }
  }, [set, originalSet]);

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleDeleteSet = () => {
    onDeleteSet(set.id);
    onBack();
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setPendingAction('back');
      setShowUnsavedChangesModal(true);
    } else {
      onBack();
    }
  };

  const handleConfirmUnsavedChanges = () => {
    if (pendingAction === 'back') {
      onBack();
    }
    setShowUnsavedChangesModal(false);
    setPendingAction(null);
  };

  const handleCancelUnsavedChanges = () => {
    setShowUnsavedChangesModal(false);
    setPendingAction(null);
  };

  const handleSaveChanges = async () => {
    // Check if any new cards have empty words - remove them
    const validWords = set.words.filter(word => {
      const wordObj = typeof word === 'string' ? { word } : word;
      return wordObj.word && wordObj.word.trim() !== '';
    });
    
    if (validWords.length !== set.words.length) {
      // Update the set to remove empty words
      onUpdateSet({ ...set, words: validWords });
    }
    
    // Save current changes
    setOriginalSet(JSON.parse(JSON.stringify({ ...set, words: validWords })));
    setHasUnsavedChanges(false);
    setIsCreatingNewCard(false);
    
    // Generate AI content only for words that have AI generation requested
    const wordsToEnrich = validWords.filter(word => {
      const wordIndex = set.words.findIndex(w => w === word);
      const options = aiGenerationOptions[wordIndex] || {};
      
      return options.translation || options.sentence || options.image;
    });
    
    if (wordsToEnrich.length > 0) {
      console.log('Generating AI content for', wordsToEnrich.length, 'words...');
      alert(`AI generation started for ${wordsToEnrich.length} words with requested features.`);
    }
    
    // Clear AI generation options
    setAiGenerationOptions({});
  };

  const handleExportComplete = (format, filename) => {
    console.log(`Export completed: ${filename} in ${format} format`);
    setShowExportModal(false);
  };

  const updateWordField = (index, field, value) => {
    const updatedWords = [...set.words];
    if (typeof updatedWords[index] === 'string') {
      // Convert simple string to object
      updatedWords[index] = { word: updatedWords[index] };
    }
    updatedWords[index] = { ...updatedWords[index], [field]: value };
    onUpdateSet({ ...set, words: updatedWords });
  };

  const deleteWord = (index) => {
    const updatedWords = set.words.filter((_, i) => i !== index);
    onUpdateSet({ ...set, words: updatedWords });
  };

  const addNewWord = () => {
    const newWord = {
      word: '',
      translation: '',
      sentence: '',
      sentenceTranslation: '',
      image: '',
      pronunciation: '',
      tags: []
    };
    const updatedWords = [...set.words, newWord];
    onUpdateSet({ ...set, words: updatedWords });
    setEditingCard(updatedWords.length - 1);
    setEditingField('word');
    setEditingValue('');
    setIsCreatingNewCard(true);
  };

  const toggleAiGeneration = (cardIndex, field) => {
    setAiGenerationOptions(prev => ({
      ...prev,
      [cardIndex]: {
        ...prev[cardIndex],
        [field]: !prev[cardIndex]?.[field]
      }
    }));
  };

  const startEdit = (cardIndex, field, currentValue) => {
    // If we were creating a new card and switching to edit something else
    // without saving the word, remove the empty card
    if (isCreatingNewCard && editingCard !== null && editingField === 'word' && 
        (!editingValue || editingValue.trim() === '') && 
        (cardIndex !== editingCard || field !== 'word')) {
      
      const updatedWords = set.words.filter((_, index) => index !== editingCard);
      onUpdateSet({ ...set, words: updatedWords });
      setIsCreatingNewCard(false);
    }
    
    setEditingCard(cardIndex);
    setEditingField(field);
    setEditingValue(currentValue || '');
  };

  const saveEdit = () => {
    if (editingCard !== null && editingField) {
      updateWordField(editingCard, editingField, editingValue);
    }
    
    // Check if we were creating a new card and the word field is empty
    if (isCreatingNewCard && editingField === 'word' && (!editingValue || editingValue.trim() === '')) {
      // Remove the empty card
      const updatedWords = set.words.filter((_, index) => index !== editingCard);
      onUpdateSet({ ...set, words: updatedWords });
      setIsCreatingNewCard(false);
    }
    
    setEditingCard(null);
    setEditingField(null);
    setEditingValue('');
  };

  // eslint-disable-next-line no-unused-vars
  const cancelEdit = () => {
    // Check if we were creating a new card and the word field is empty
    if (isCreatingNewCard && editingField === 'word' && (!editingValue || editingValue.trim() === '')) {
      // Remove the empty card
      const updatedWords = set.words.filter((_, index) => index !== editingCard);
      onUpdateSet({ ...set, words: updatedWords });
      setIsCreatingNewCard(false);
    }
    
    setEditingCard(null);
    setEditingField(null);
    setEditingValue('');
  };

  const playAudio = (text, language = 'en') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to set appropriate language
      const langMap = {
        'spanish': 'es-ES',
        'french': 'fr-FR',
        'japanese': 'ja-JP',
        'german': 'de-DE'
      };
      
      const setName = set.name.toLowerCase();
      Object.keys(langMap).forEach(lang => {
        if (setName.includes(lang)) {
          utterance.lang = langMap[lang];
        }
      });
      
      speechSynthesis.speak(utterance);
    }
  };

  // Filter words based on search term
  const filteredWords = set.words.filter(word => {
    const wordText = typeof word === 'string' ? word : word.word;
    const translation = typeof word === 'object' ? word.translation : '';
    const sentence = typeof word === 'object' ? word.sentence : '';
    
    const searchLower = searchTerm.toLowerCase();
    return wordText.toLowerCase().includes(searchLower) ||
           translation.toLowerCase().includes(searchLower) ||
           sentence.toLowerCase().includes(searchLower);
  });

  const WordCard = ({ word, index, originalIndex }) => {
    const wordObj = typeof word === 'string' ? { word } : word;
    const isEditing = editingCard === originalIndex;
    const isNewCard = isCreatingNewCard && originalIndex === set.words.length - 1;
    const aiOptions = aiGenerationOptions[originalIndex] || {};

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50 p-4 sm:p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex flex-col space-y-4">
          
          {/* Word and Translation */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-3">
                {/* Main Word */}
                <div className="flex items-center space-x-2">
                  {isEditing && editingField === 'word' ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 w-full"
                      onBlur={saveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveEdit();
                        } else if (e.key === 'Escape') {
                          cancelEdit();
                        }
                      }}
                      autoFocus
                      placeholder="Enter word..."
                    />
                  ) : (
                    <h3 
                      className={`text-xl font-bold cursor-pointer hover:text-blue-600 transition-colors w-full ${
                        !wordObj.word ? 'text-gray-400 italic' : 'text-gray-900'
                      }`}
                      onClick={() => startEdit(originalIndex, 'word', wordObj.word)}
                    >
                      {wordObj.word || 'Click to add word'}
                    </h3>
                  )}
                  
                  {/* Listen Button for Word */}
                  {wordObj.word && (
                    <button
                      onClick={() => playAudio(wordObj.word)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                      title="Listen to pronunciation"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.646 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.646l3.737-2.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons - Fixed positioning */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => setEditingCard(editingCard === originalIndex ? null : originalIndex)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit word"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => deleteWord(originalIndex)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete word"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
              
            {/* Pronunciation */}
            {wordObj.pronunciation && (
              <div className="text-sm text-gray-500 font-mono">
                {wordObj.pronunciation}
              </div>
            )}
            
            {/* Translation */}
            <div className="flex items-center space-x-2">
              {isEditing && editingField === 'translation' ? (
                <input
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  className="text-lg text-gray-600 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 flex-1"
                  onBlur={saveEdit}
                  onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                  autoFocus
                  placeholder="Enter translation..."
                />
              ) : (
                <span 
                  className={`text-lg cursor-pointer hover:text-blue-600 transition-colors flex-1 ${
                    !wordObj.translation ? 'text-gray-400 italic' : 'text-gray-600'
                  }`}
                  onClick={() => startEdit(originalIndex, 'translation', wordObj.translation)}
                >
                  {wordObj.translation || 'Click to add translation'}
                </span>
              )}
              
              {/* AI Generation Toggle for Translation */}
              {isNewCard && (
                <button
                  onClick={() => toggleAiGeneration(originalIndex, 'translation')}
                  className={`p-1 rounded transition-colors ${
                    aiOptions.translation 
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Toggle AI generation for translation"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Image */}
          {wordObj.image ? (
            <div className="w-full h-32 sm:h-40 rounded-lg overflow-hidden relative group">
              <img 
                src={wordObj.image} 
                alt={wordObj.word}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center">
                <button
                  onClick={() => startEdit(originalIndex, 'image', wordObj.image)}
                  className="opacity-0 group-hover:opacity-100 bg-white/90 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white"
                >
                  Change Image
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="w-full h-32 sm:h-40 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-all duration-200 flex items-center justify-center group"
              onClick={() => startEdit(originalIndex, 'image', wordObj.image)}
            >
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {/* AI Generation Toggle for Image */}
                  {isNewCard && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAiGeneration(originalIndex, 'image');
                      }}
                      className={`p-1 rounded transition-colors ${
                        aiOptions.image 
                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Toggle AI generation for image"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors mt-2">
                  Click to add image
                  {isNewCard && aiOptions.image && (
                    <span className="block text-xs text-purple-600 mt-1">
                      AI will generate
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Example Sentence */}
          {wordObj.sentence || (isEditing && editingField === 'sentence') ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                {isEditing && editingField === 'sentence' ? (
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    className="text-sm text-gray-700 italic bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 flex-1"
                    onBlur={saveEdit}
                    onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                    autoFocus
                    placeholder="Enter example sentence..."
                  />
                ) : (
                  <span 
                    className="text-sm text-gray-700 italic cursor-pointer hover:text-blue-600 transition-colors flex-1"
                    onClick={() => startEdit(originalIndex, 'sentence', wordObj.sentence)}
                  >
                    "{wordObj.sentence}"
                  </span>
                )}
                
                {/* Listen Button for Sentence */}
                {wordObj.sentence && (
                  <button
                    onClick={() => playAudio(wordObj.sentence)}
                    className="p-1 text-gray-500 hover:bg-gray-50 rounded transition-colors ml-2"
                    title="Listen to sentence"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.646 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.646l3.737-2.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              
              {wordObj.sentenceTranslation && (
                <div className="text-xs text-gray-500">
                  {wordObj.sentenceTranslation}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div 
                className="text-sm text-gray-400 italic cursor-pointer hover:text-blue-600 transition-colors py-2 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-lg text-center flex-1"
                onClick={() => startEdit(originalIndex, 'sentence', wordObj.sentence)}
              >
                Click to add example sentence
              </div>
              
              {/* AI Generation Toggle for Sentence */}
              {isNewCard && (
                <button
                  onClick={() => toggleAiGeneration(originalIndex, 'sentence')}
                  className={`p-1 rounded transition-colors ${
                    aiOptions.sentence 
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Toggle AI generation for sentence"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Tags */}
          {wordObj.tags && wordObj.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {wordObj.tags.map((tag, tagIndex) => (
                <span 
                  key={tagIndex}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const WordTable = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Translation</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Example</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredWords.map((word, index) => {
              const originalIndex = set.words.findIndex(w => w === word);
              const wordObj = typeof word === 'string' ? { word } : word;
              const isEditing = editingCard === originalIndex;
              
              return (
                <tr key={originalIndex} className="hover:bg-gray-50/50">
                  {/* Image Column */}
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      {wordObj.image ? (
                        <img 
                          src={wordObj.image} 
                          alt={wordObj.word}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <button
                        onClick={() => startEdit(originalIndex, 'image', wordObj.image)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit image"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  
                  {/* Word Column */}
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      {isEditing && editingField === 'word' ? (
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="font-medium text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 w-full"
                          onBlur={saveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveEdit();
                            } else if (e.key === 'Escape') {
                              cancelEdit();
                            }
                          }}
                          autoFocus
                          placeholder="Enter word..."
                        />
                      ) : (
                        <span 
                          className={`font-medium cursor-pointer hover:text-blue-600 transition-colors ${
                            !wordObj.word ? 'text-gray-400 italic' : 'text-gray-900'
                          }`}
                          onClick={() => startEdit(originalIndex, 'word', wordObj.word)}
                        >
                          {wordObj.word || 'Click to add word'}
                        </span>
                      )}
                      
                      {wordObj.word && (
                        <button
                          onClick={() => playAudio(wordObj.word)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Listen"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.646 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.646l3.737-2.793a1 1 0 011.617.793z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                  
                  {/* Translation Column */}
                  <td className="px-4 py-4">
                    {isEditing && editingField === 'translation' ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="text-sm text-gray-600 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 w-full"
                        onBlur={saveEdit}
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                        autoFocus
                        placeholder="Enter translation..."
                      />
                    ) : (
                      <span 
                        className={`text-sm cursor-pointer hover:text-blue-600 transition-colors ${
                          !wordObj.translation ? 'text-gray-400 italic' : 'text-gray-600'
                        }`}
                        onClick={() => startEdit(originalIndex, 'translation', wordObj.translation)}
                      >
                        {wordObj.translation || 'Click to add translation'}
                      </span>
                    )}
                  </td>
                  
                  {/* Example Column */}
                  <td className="px-4 py-4 max-w-xs">
                    {wordObj.sentence ? (
                      <div className="flex items-center space-x-1">
                        {isEditing && editingField === 'sentence' ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="text-sm text-gray-600 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 w-full"
                            onBlur={saveEdit}
                            onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                            autoFocus
                            placeholder="Enter example sentence..."
                          />
                        ) : (
                          <span 
                            className="text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors truncate"
                            onClick={() => startEdit(originalIndex, 'sentence', wordObj.sentence)}
                          >
                            "{wordObj.sentence}"
                          </span>
                        )}
                        <button
                          onClick={() => playAudio(wordObj.sentence)}
                          className="p-1 text-gray-500 hover:bg-gray-50 rounded transition-colors"
                          title="Listen to sentence"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.646 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.646l3.737-2.793a1 1 0 011.617.793z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span 
                        className="text-sm text-gray-400 italic cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => startEdit(originalIndex, 'sentence', wordObj.sentence)}
                      >
                        Click to add example
                      </span>
                    )}
                  </td>
                  
                  {/* Tags Column */}
                  <td className="px-4 py-4">
                    {wordObj.tags && wordObj.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {wordObj.tags.slice(0, 2).map((tag, tagIndex) => (
                          <span key={tagIndex} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            {tag}
                          </span>
                        ))}
                        {wordObj.tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{wordObj.tags.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  
                  {/* Actions Column */}
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => startEdit(originalIndex, 'word', wordObj.word)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteWord(originalIndex)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {/* Add New Row - Dashed - Only show if not creating a new card */}
            {!isCreatingNewCard && (
              <tr className="border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all duration-200" onClick={addNewWord}>
                <td colSpan="6" className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center space-x-3 text-gray-500 hover:text-blue-600 transition-colors">
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="font-medium">Add New Card</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header */}
        <div className="mb-8">
          {/* Top Row - Back Button and Title */}
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={handleBack}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            
            <div className="h-8 w-px bg-gray-300"></div>
            
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{set.name}</h1>
              <p className="text-gray-600 mt-1">{filteredWords.length} words {searchTerm && `(filtered from ${set.words.length})`}</p>
            </div>
          </div>
          
          {/* Bottom Row - Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Left Side - Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search words..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-sm"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Right Side - View Toggle and Actions */}
            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-1 shadow-sm">
                <button
                  onClick={() => onViewModeChange('cards')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'cards'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Cards
                </button>
                <button
                  onClick={() => onViewModeChange('table')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Table
                </button>
              </div>
              
              {/* Action Buttons */}
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
              
              <button
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                  hasUnsavedChanges 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Changes
                {hasUnsavedChanges && (
                  <div className="w-2 h-2 bg-red-400 rounded-full ml-2 animate-pulse"></div>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* No results message */}
        {filteredWords.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No words found</h3>
            <p className="text-gray-600">Try adjusting your search term or clear the search to see all words.</p>
            <button
              onClick={() => onSearchChange('')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Content Area */}
        {filteredWords.length > 0 && (
          <>
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredWords.map((word, index) => {
                  const originalIndex = set.words.findIndex(w => w === word);
                  return (
                    <WordCard 
                      key={originalIndex} 
                      word={word} 
                      index={index} 
                      originalIndex={originalIndex} 
                    />
                  );
                })}
                
                {/* Dotted Add Card Button - Only show if not creating a new card */}
                {!isCreatingNewCard && (
                  <div 
                    onClick={addNewWord}
                    className="group bg-white/40 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 p-4 sm:p-6 hover:bg-white/60 transition-all duration-300 cursor-pointer min-h-[200px] flex flex-col items-center justify-center"
                  >
                    {/* Plus Icon */}
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 group-hover:border-blue-500 flex items-center justify-center mb-4 transition-colors duration-300">
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    
                    {/* Text */}
                    <h3 className="text-lg font-medium text-gray-500 group-hover:text-blue-600 transition-colors duration-300 mb-2">Add New Card</h3>
                    <p className="text-sm text-gray-400 group-hover:text-blue-500 transition-colors duration-300 text-center">Click to add a new vocabulary word</p>
                    
                    {/* Dotted decoration */}
                    <div className="mt-4 flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-blue-400 transition-colors duration-300"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-blue-400 transition-colors duration-300 animation-delay-100"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-blue-400 transition-colors duration-300 animation-delay-200"></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <WordTable />
            )}
          </>
        )}

        {/* Empty state for new sets */}
        {set.words.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No words yet</h3>
            <p className="text-gray-600 mb-6">Start building your vocabulary by adding your first word.</p>
            <button
              onClick={addNewWord}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add First Word
            </button>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          set={set}
          onExport={handleExportComplete}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Vocabulary Set</h3>
                  <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>"{set.name}"</strong>? 
                All {set.words.length} words will be permanently removed.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSet}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Set
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedChangesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
                  <p className="text-sm text-gray-600 mt-1">You have unsaved changes</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                You have unsaved changes that will be lost if you continue. Are you sure you want to proceed without saving?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelUnsavedChanges}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUnsavedChanges}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BackToTop />
    </div>
  );
};

export default SetViewer;