import React, { useState, useRef, useEffect } from 'react';
import BackToTop from './BackToTop';

const SetEditor = ({ set, onBack, onUpdateSet, onSaveSet, groups = [], onCreateGroup }) => {
  const [title, setTitle] = useState(set?.name || 'New Set');
  const [words, setWords] = useState(set?.words ? set.words.join('\n') : '');
  const [sourceLanguage, setSourceLanguage] = useState('Auto-detect');
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(groups.length > 0 ? groups[0].id : null);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  
  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSet, setOriginalSet] = useState(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  const sourceDropdownRef = useRef(null);
  const targetDropdownRef = useRef(null);
  const groupDropdownRef = useRef(null);

  const languages = ['Spanish', 'French', 'German', 'English', 'Auto-detect'];

  // Update selectedGroupId when groups change (e.g., new group created)
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  // Track original state for change detection
  useEffect(() => {
    if (!originalSet) {
      const currentSet = {
        name: title,
        words: words.split('\n').filter(word => word.trim() !== '')
      };
      setOriginalSet(JSON.parse(JSON.stringify(currentSet)));
    }
  }, [title, words, originalSet]);

  // Detect changes
  useEffect(() => {
    if (originalSet) {
      const currentSet = {
        name: title,
        words: words.split('\n').filter(word => word.trim() !== '')
      };
      const hasChanges = JSON.stringify(currentSet) !== JSON.stringify(originalSet);
      setHasUnsavedChanges(hasChanges);
    }
  }, [title, words, originalSet]);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target)) {
        setSourceDropdownOpen(false);
      }
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(event.target)) {
        setTargetDropdownOpen(false);
      }
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target)) {
        setGroupDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
  };

  const handleWordsChange = (e) => {
    const newWords = e.target.value;
    setWords(newWords);
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setPendingAction('back');
      setShowUnsavedChangesModal(true);
    } else {
      onBack();
    }
  };

  const handleSaveChanges = () => {
    const wordsArray = words.split('\n').filter(word => word.trim() !== '');
    if (title.trim() && wordsArray.length > 0) {
      if (set?.id) {
        onUpdateSet({ ...set, name: title, words: wordsArray });
      } else {
        onSaveSet({ name: title, words: wordsArray }, selectedGroupId);
      }
      
      // Update original set to reflect saved state
      const savedSet = {
        name: title,
        words: wordsArray
      };
      setOriginalSet(JSON.parse(JSON.stringify(savedSet)));
      setHasUnsavedChanges(false);
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

  // Mock enriched word data
  const mockEnrichedWord = {
    word: 'estudiar',
    sentence: 'Me gusta estudiar español por la mañana.',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop',
    hasAudio: true
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-gray-200/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <button
                onClick={handleBack}
                className="flex items-center px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 flex-shrink-0"
              >
                <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
              
              <div className="h-6 sm:h-8 w-px bg-gray-300 flex-shrink-0"></div>
              
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  {set?.id ? 'Edit Vocabulary Set' : 'Create New Vocabulary Set'}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  {words.split('\n').filter(word => word.trim()).length} words
                  {set?.id ? ' (editing)' : ' (new set)'}
                </p>
              </div>
            </div>
            
            {/* Save Button */}
            <button
              onClick={handleSaveChanges}
              disabled={!hasUnsavedChanges && !(!set?.id && title.trim() && words.trim())}
              className={`inline-flex items-center justify-center px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0 ${
                hasUnsavedChanges || (!set?.id && title.trim() && words.trim())
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span className="hidden sm:inline">{set?.id ? 'Save Changes' : 'Create Set'}</span>
              <span className="sm:hidden">{set?.id ? 'Save' : 'Create'}</span>
              {hasUnsavedChanges && (
                <div className="w-2 h-2 bg-red-400 rounded-full ml-2 animate-pulse"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Main Content Card - All sections combined */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50 p-6 mb-8">
          
          {/* Set Title Input */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Set Information
            </h2>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Set Title
              </label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter set title (e.g., Spanish Basics, Business English)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 text-gray-700 font-medium"
              />
            </div>
          </div>
          
          {/* Group Selection - Show when creating new set */}
          {!set?.id && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
                </svg>
                Group Selection
              </h2>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Save to Group
                </label>
                <div className="relative" ref={groupDropdownRef}>
                  <button
                    onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-left focus:border-purple-500 focus:ring-0 transition-all duration-200 hover:border-gray-300 text-gray-700 font-medium flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      {selectedGroupId && groups.find(g => g.id === selectedGroupId) && (
                        <div className={`w-4 h-4 rounded-full mr-3 bg-gradient-to-r ${
                          groups.find(g => g.id === selectedGroupId)?.color === 'blue' ? 'from-blue-500 to-blue-600' :
                          groups.find(g => g.id === selectedGroupId)?.color === 'green' ? 'from-green-500 to-green-600' :
                          groups.find(g => g.id === selectedGroupId)?.color === 'purple' ? 'from-purple-500 to-purple-600' :
                          groups.find(g => g.id === selectedGroupId)?.color === 'red' ? 'from-red-500 to-red-600' :
                          groups.find(g => g.id === selectedGroupId)?.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
                          groups.find(g => g.id === selectedGroupId)?.color === 'pink' ? 'from-pink-500 to-pink-600' :
                          groups.find(g => g.id === selectedGroupId)?.color === 'indigo' ? 'from-indigo-500 to-indigo-600' :
                          'from-gray-500 to-gray-600'
                        }`}></div>
                      )}
                      <span>
                        {selectedGroupId && groups.find(g => g.id === selectedGroupId) 
                          ? groups.find(g => g.id === selectedGroupId)?.name 
                          : groups.length > 0 
                            ? 'Select a group' 
                            : 'No groups available'}
                      </span>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${groupDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {groupDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
                      {groups.length > 0 ? (
                        groups.map((group) => (
                          <button
                            key={group.id}
                            onClick={() => {
                              setSelectedGroupId(group.id);
                              setGroupDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors duration-150 text-gray-700 font-medium flex items-center"
                          >
                            <div className={`w-4 h-4 rounded-full mr-3 bg-gradient-to-r ${
                              group.color === 'blue' ? 'from-blue-500 to-blue-600' :
                              group.color === 'green' ? 'from-green-500 to-green-600' :
                              group.color === 'purple' ? 'from-purple-500 to-purple-600' :
                              group.color === 'red' ? 'from-red-500 to-red-600' :
                              group.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
                              group.color === 'pink' ? 'from-pink-500 to-pink-600' :
                              group.color === 'indigo' ? 'from-indigo-500 to-indigo-600' :
                              'from-gray-500 to-gray-600'
                            }`}></div>
                            <div>
                              <div className="font-semibold">{group.name}</div>
                              <div className="text-xs text-gray-500">
                                {group.sets.length} set{group.sets.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <button
                          onClick={() => {
                            if (onCreateGroup) {
                              const newGroup = onCreateGroup({
                                name: 'My Vocabulary',
                                color: 'blue'
                              });
                              if (newGroup && newGroup.id) {
                                setSelectedGroupId(newGroup.id);
                              }
                            }
                            setGroupDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors duration-150 text-purple-600 font-medium flex items-center"
                        >
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <div>
                            <div className="font-semibold">Create New Group</div>
                            <div className="text-xs text-gray-500">
                              Create "My Vocabulary" group
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Language Selection */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Language Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Source Language
                </label>
                <div className="relative" ref={sourceDropdownRef}>
                  <button
                    onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-left focus:border-blue-500 focus:ring-0 transition-all duration-200 hover:border-gray-300 text-gray-700 font-medium flex items-center justify-between"
                  >
                    <span>{sourceLanguage}</span>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${sourceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {sourceDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
                      {languages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setSourceLanguage(lang);
                            setSourceDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors duration-150 text-gray-700 font-medium"
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Target Language
                </label>
                <div className="relative" ref={targetDropdownRef}>
                  <button
                    onClick={() => setTargetDropdownOpen(!targetDropdownOpen)}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-left focus:border-blue-500 focus:ring-0 transition-all duration-200 hover:border-gray-300 text-gray-700 font-medium flex items-center justify-between"
                  >
                    <span>{targetLanguage}</span>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${targetDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {targetDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
                      {languages.filter(lang => lang !== 'Auto-detect').map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setTargetLanguage(lang);
                            setTargetDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors duration-150 text-gray-700 font-medium"
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-8"></div>

          {/* Words Input Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Add Your Words
            </h2>
            
            <div className="relative">
              <textarea
                value={words}
                onChange={handleWordsChange}
                placeholder="Paste your words here, one per line...

estudiar
caminar
escribir
leer"
                className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 text-gray-700 placeholder-gray-400"
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/90 px-2 py-1 rounded-lg backdrop-blur-sm">
                {words.split('\n').filter(word => word.trim()).length} words
              </div>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 flex items-center w-full sm:w-auto justify-center">
                <svg className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Process Words
              </button>
              
            </div>
          </div>

          {/* Preview Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview: Enriched Word Card
            </h2>
            
            <div className="max-w-md">
              <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
                
                {/* Image */}
                <div className="mb-6">
                  <div className="relative group">
                    <img
                      src={mockEnrichedWord.imageUrl}
                      alt={mockEnrichedWord.word}
                      className="w-full h-40 object-cover rounded-xl shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-xl"></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors font-medium">
                      Next Image
                    </button>
                    <button className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors font-medium">
                      Upload Custom
                    </button>
                    <button className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors font-medium">
                      Remove
                    </button>
                  </div>
                </div>

                {/* Word */}
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 text-center">
                    {mockEnrichedWord.word}
                  </h3>
                </div>

                {/* Sentence */}
                <div className="mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-gray-700 italic text-center leading-relaxed">
                      "{mockEnrichedWord.sentence}"
                    </p>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium flex items-center mx-auto">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate sentence
                  </button>
                </div>

                {/* Audio */}
                <div className="text-center">
                  <button className="group bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white p-4 rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                    <svg className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <p className="text-sm text-gray-600 mt-2 font-medium">Play pronunciation</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unsaved Changes Confirmation Modal */}
        {showUnsavedChangesModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
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

        {/* Back to Top Button */}
        <BackToTop />
      </div>
    </div>
  );
};

export default SetEditor;