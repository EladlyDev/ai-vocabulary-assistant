import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import BackToTop from './BackToTop';
import { processWordsInBatches } from '../services/aiService';

const SetEditor = ({ set, onBack, onUpdateSet, onSaveSet, groups = [], onCreateGroup }) => {
  // Initialize from localStorage backup if available
  const [title, setTitle] = useState(() => {
    const backup = localStorage.getItem('editorBackup');
    if (backup) {
      const parsed = JSON.parse(backup);
      return parsed.title || set?.name || 'New Set';
    }
    return set?.name || 'New Set';
  });
  
  const [words, setWords] = useState(() => {
    const backup = localStorage.getItem('editorBackup');
    if (backup) {
      const parsed = JSON.parse(backup);
      return parsed.words || (set?.words ? set.words.join('\n') : '');
    }
    return set?.words ? set.words.join('\n') : '';
  });
  
  const [sourceLanguage, setSourceLanguage] = useState(() => {
    // First priority: existing set's language
    if (set?.source_language) {
      return set.source_language;
    }
    // Second priority: localStorage backup
    const backup = localStorage.getItem('editorBackup');
    if (backup) {
      const parsed = JSON.parse(backup);
      return parsed.sourceLanguage || 'Auto-detect';
    }
    return 'Auto-detect';
  });
  
  const [targetLanguage, setTargetLanguage] = useState(() => {
    // First priority: existing set's language
    if (set?.target_language) {
      return set.target_language;
    }
    // Second priority: localStorage backup
    const backup = localStorage.getItem('editorBackup');
    if (backup) {
      const parsed = JSON.parse(backup);
      return parsed.targetLanguage || 'English';
    }
    return 'English';
  });
  
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  
  // Language search states
  const [sourceSearchQuery, setSourceSearchQuery] = useState('');
  const [targetSearchQuery, setTargetSearchQuery] = useState('');
  
  const [selectedGroupId, setSelectedGroupId] = useState(() => {
    const backup = localStorage.getItem('editorBackup');
    if (backup) {
      const parsed = JSON.parse(backup);
      return parsed.selectedGroupId || (groups.length > 0 ? groups[0].id : null);
    }
    return groups.length > 0 ? groups[0].id : null;
  });
  
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  
  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSet, setOriginalSet] = useState(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showBackupRestored, setShowBackupRestored] = useState(false);
  
  // AI processing states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [processedWords, setProcessedWords] = useState([]); // Array of enriched word objects
  
  const sourceDropdownRef = useRef(null);
  const targetDropdownRef = useRef(null);
  const groupDropdownRef = useRef(null);
  
  // Cache for change detection to avoid expensive JSON.stringify on every render
  const originalSetHash = useRef(null);
  
  // Show notification if backup was restored
  useEffect(() => {
    const backup = localStorage.getItem('editorBackup');
    if (backup) {
      const parsed = JSON.parse(backup);
      const timestamp = parsed.timestamp;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      // Check if backup is actually different from current props
      const isDifferent = parsed.title !== (set?.name || 'New Set') ||
                          parsed.words !== (set?.words ? set.words.join('\n') : '');
      
      // Only show notification if backup is recent (within 5 minutes) AND different
      if (timestamp && (now - timestamp) < fiveMinutes && isDifferent) {
        setShowBackupRestored(true);
        setTimeout(() => setShowBackupRestored(false), 5000);
      }
    }
  }, []); // Empty dependency - only run once on mount
  
  // Auto-save to localStorage
  useEffect(() => {
    const backup = {
      title,
      words,
      sourceLanguage,
      targetLanguage,
      selectedGroupId,
      timestamp: Date.now()
    };
    localStorage.setItem('editorBackup', JSON.stringify(backup));
  }, [title, words, sourceLanguage, targetLanguage, selectedGroupId]);

  const allLanguages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Russian',
    'Arabic',
    'Chinese (Mandarin)',
    'Japanese',
    'Korean',
    'Hindi',
    'Turkish',
    'Dutch',
    'Polish',
    'Swedish',
    'Norwegian',
    'Danish',
    'Finnish',
    'Greek',
    'Hebrew',
    'Thai',
    'Vietnamese',
    'Indonesian',
    'Malay',
    'Filipino',
    'Ukrainian',
    'Czech',
    'Romanian',
    'Hungarian',
    'Persian (Farsi)',
    'Urdu',
    'Bengali',
    'Tamil',
    'Telugu',
    'Swahili'
  ];

  // Get recent languages from localStorage
  const getRecentLanguages = () => {
    const recent = localStorage.getItem('recentLanguages');
    return recent ? JSON.parse(recent) : ['English', 'Spanish', 'Arabic'];
  };

  // Save language to recent list
  const saveToRecent = (language) => {
    if (language === 'Auto-detect') return;
    
    let recent = getRecentLanguages();
    // Remove if already exists
    recent = recent.filter(lang => lang !== language);
    // Add to beginning
    recent.unshift(language);
    // Keep only top 5
    recent = recent.slice(0, 5);
    localStorage.setItem('recentLanguages', JSON.stringify(recent));
  };

  // Filter languages based on search
  const getFilteredLanguages = (searchQuery, includeRecent = true) => {
    const recent = getRecentLanguages();
    const filtered = allLanguages.filter(lang =>
      lang.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (includeRecent && !searchQuery) {
      // Show recent at top when no search query
      const nonRecent = filtered.filter(lang => !recent.includes(lang));
      return { recent, other: nonRecent };
    }
    
    return { recent: [], other: filtered };
  };
  
  // Memoize parsed words array - only recalculate when words string changes
  const wordsArray = useMemo(() => {
    return words.split('\n').filter(word => word.trim() !== '');
  }, [words]);
  
  // Memoize word count - only recalculate when wordsArray changes
  const wordCount = useMemo(() => wordsArray.length, [wordsArray]);

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
        words: wordsArray
      };
      const clonedSet = JSON.parse(JSON.stringify(currentSet));
      setOriginalSet(clonedSet);
      originalSetHash.current = JSON.stringify(clonedSet);
    }
  }, [title, wordsArray, originalSet]);

  // Optimized change detection using hash comparison
  const checkForChanges = useCallback(() => {
    if (!originalSet || !originalSetHash.current) return false;
    
    const currentSet = {
      name: title,
      words: wordsArray
    };
    const currentHash = JSON.stringify(currentSet);
    
    return currentHash !== originalSetHash.current;
  }, [title, wordsArray, originalSet]);

  // Detect changes with memoization
  useEffect(() => {
    const hasChanges = checkForChanges();
    if (hasChanges !== hasUnsavedChanges) {
      setHasUnsavedChanges(hasChanges);
    }
  }, [checkForChanges, hasUnsavedChanges]);

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

  const handleTitleChange = useCallback((e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
  }, []);

  const handleWordsChange = useCallback((e) => {
    const newWords = e.target.value;
    setWords(newWords);
  }, []);

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingAction('back');
      setShowUnsavedChangesModal(true);
    } else {
      onBack();
    }
  }, [hasUnsavedChanges, onBack]);

  const handleSaveChanges = () => {
    // Use processed words if available, otherwise fall back to simple words array
    const dataToSave = processedWords.length > 0 ? processedWords : wordsArray;
    
    if (title.trim() && dataToSave.length > 0) {
      const setData = {
        name: title,
        words: dataToSave,
        source_language: sourceLanguage,
        target_language: targetLanguage
      };
      
      if (set?.id) {
        onUpdateSet({ ...set, ...setData });
      } else {
        onSaveSet(setData, selectedGroupId);
      }
      
      // DON'T clear backup here - let the upload process handle it
      // This allows user to go back to editor if upload fails
      
      // Update original set to reflect saved state
      const savedSet = {
        name: title,
        words: dataToSave
      };
      const clonedSet = JSON.parse(JSON.stringify(savedSet));
      setOriginalSet(clonedSet);
      originalSetHash.current = JSON.stringify(clonedSet);
      setHasUnsavedChanges(false);
    }
  };

  const handleProcessWords = async () => {
    // Validate that we have words
    if (!words.trim()) {
      setGenerationError('Please add some words first before processing.');
      return;
    }

    // Parse words from the textarea
    const wordList = words.split('\n')
      .map(line => line.trim())
      .filter(line => line) // Remove empty lines
      .map(line => {
        // Extract just the word part (before | or the whole line if no |)
        const parts = line.split('|');
        return parts[0].trim();
      })
      .filter(word => word); // Remove empty words

    if (wordList.length === 0) {
      setGenerationError('No valid words found to process.');
      return;
    }

    // Start processing
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress({ current: 0, total: wordList.length });
    setProcessedWords([]); // Clear previous results

    try {
      // Process words in batches with progress tracking
      const result = await processWordsInBatches(
        wordList,
        sourceLanguage,
        targetLanguage,
        20, // chunk size
        (current, total) => {
          setGenerationProgress({ current, total });
        }
      );

      // Convert to array of enriched word objects for display
      const enrichedWords = Object.keys(result.words).map(word => ({
        word: word,
        translation: result.words[word].translation,
        sentence: result.words[word].sentence,
        sentenceTranslation: result.words[word].sentenceTranslation
      }));

      setProcessedWords(enrichedWords);
      setIsGenerating(false);
      
      // Show success message briefly
      setTimeout(() => {
        setGenerationProgress({ current: 0, total: 0 });
      }, 2000);
    } catch (error) {
      setGenerationError(error.message || 'Failed to process words. Please try again.');
      setIsGenerating(false);
      setGenerationProgress({ current: 0, total: 0 });
    }
  };

  const handlePlayPronunciation = (word, language) => {
    // Use Web Speech API to pronounce the word
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(word);
      
      // Comprehensive language codes mapping
      const languageCodes = {
        'English': 'en-US',
        'Spanish': 'es-ES',
        'French': 'fr-FR',
        'German': 'de-DE',
        'Italian': 'it-IT',
        'Portuguese': 'pt-PT',
        'Russian': 'ru-RU',
        'Arabic': 'ar-SA',
        'Chinese (Mandarin)': 'zh-CN',
        'Japanese': 'ja-JP',
        'Korean': 'ko-KR',
        'Hindi': 'hi-IN',
        'Turkish': 'tr-TR',
        'Dutch': 'nl-NL',
        'Polish': 'pl-PL',
        'Swedish': 'sv-SE',
        'Norwegian': 'no-NO',
        'Danish': 'da-DK',
        'Finnish': 'fi-FI',
        'Greek': 'el-GR',
        'Hebrew': 'he-IL',
        'Thai': 'th-TH',
        'Vietnamese': 'vi-VN',
        'Indonesian': 'id-ID',
        'Malay': 'ms-MY',
        'Filipino': 'fil-PH',
        'Ukrainian': 'uk-UA',
        'Czech': 'cs-CZ',
        'Romanian': 'ro-RO',
        'Hungarian': 'hu-HU',
        'Persian (Farsi)': 'fa-IR',
        'Urdu': 'ur-PK',
        'Bengali': 'bn-BD',
        'Tamil': 'ta-IN',
        'Telugu': 'te-IN',
        'Swahili': 'sw-KE'
      };
      
      const langCode = languageCodes[language] || 'en-US';
      utterance.lang = langCode;
      utterance.rate = 0.85; // Slightly slower for learning
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Wait for voices to be loaded (important for some browsers, especially for Arabic)
      const speakWithVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        
        // For Arabic, try multiple approaches
        if (language === 'Arabic') {
          // Try to find Arabic voice with various patterns
          let voice = voices.find(v => v.lang === 'ar-SA') ||
                      voices.find(v => v.lang.startsWith('ar-')) ||
                      voices.find(v => v.lang.includes('ar')) ||
                      voices.find(v => v.name.toLowerCase().includes('arabic'));
          
          if (voice) {
            utterance.voice = voice;
          }
        } else {
          // For other languages, find matching voice
          const langPrefix = langCode.split('-')[0];
          const voice = voices.find(v => v.lang === langCode) ||
                       voices.find(v => v.lang.startsWith(langPrefix));
          
          if (voice) {
            utterance.voice = voice;
          }
        }
        
        // Small delay before speaking (helps with some browsers)
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, 100);
      };
      
      // Check if voices are already loaded
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        speakWithVoice();
      } else {
        // Wait for voices to load (critical for Arabic and other languages)
        window.speechSynthesis.onvoiceschanged = () => {
          speakWithVoice();
          window.speechSynthesis.onvoiceschanged = null; // Clean up
        };
        
        // Fallback: Try after 500ms even if event doesn't fire
        setTimeout(() => {
          if (window.speechSynthesis.getVoices().length > 0) {
            speakWithVoice();
          }
        }, 500);
      }
    }
  };

  const handleConfirmUnsavedChanges = () => {
    if (pendingAction === 'back') {
      // Clear backup when user confirms leaving without saving
      localStorage.removeItem('editorBackup');
      onBack();
    }
    setShowUnsavedChangesModal(false);
    setPendingAction(null);
  };

  const handleCancelUnsavedChanges = () => {
    setShowUnsavedChangesModal(false);
    setPendingAction(null);
  };
  
  const handleDismissBackupNotification = () => {
    setShowBackupRestored(false);
    // Optionally clear the backup when user dismisses
    // localStorage.removeItem('editorBackup');
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
      {/* Backup Restored Notification */}
      {showBackupRestored && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down max-w-lg">
          <div className="bg-green-50 border-2 border-green-200 text-green-800 px-6 py-3 rounded-xl shadow-lg flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">
                Your work was automatically restored from backup!
              </span>
            </div>
            <button
              onClick={handleDismissBackupNotification}
              className="flex-shrink-0 text-green-600 hover:text-green-800 transition-colors"
              title="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
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
                  {wordCount} words
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
                    onClick={() => {
                      setSourceDropdownOpen(!sourceDropdownOpen);
                      setSourceSearchQuery('');
                    }}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-left focus:border-blue-500 focus:ring-0 transition-all duration-200 hover:border-gray-300 text-gray-700 font-medium flex items-center justify-between"
                  >
                    <span>{sourceLanguage}</span>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${sourceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {sourceDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 max-h-80 overflow-hidden flex flex-col">
                      {/* Search Input */}
                      <div className="px-3 py-2 border-b border-gray-200 sticky top-0 bg-white">
                        <input
                          type="text"
                          placeholder="Search languages..."
                          value={sourceSearchQuery}
                          onChange={(e) => setSourceSearchQuery(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      {/* Language List - Scrollable */}
                      <div className="overflow-y-auto max-h-64">
                        {(() => {
                          const { recent, other } = getFilteredLanguages(sourceSearchQuery);
                          const hasResults = recent.length > 0 || other.length > 0;
                          
                          if (!hasResults) {
                            return (
                              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                                No languages found
                              </div>
                            );
                          }
                          
                          return (
                            <>
                              {/* Auto-detect option */}
                              {!sourceSearchQuery && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSourceLanguage('Auto-detect');
                                      setSourceDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors duration-150 text-gray-700 font-medium border-b border-gray-100"
                                  >
                                    <span className="text-blue-600">🔄</span> Auto-detect
                                  </button>
                                </>
                              )}
                              
                              {/* Recent Languages */}
                              {recent.length > 0 && (
                                <>
                                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Recent
                                  </div>
                                  {recent.map((lang) => (
                                    <button
                                      key={lang}
                                      onClick={() => {
                                        setSourceLanguage(lang);
                                        saveToRecent(lang);
                                        setSourceDropdownOpen(false);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors duration-150 text-gray-700 font-medium"
                                    >
                                      <span className="text-blue-600">⭐</span> {lang}
                                    </button>
                                  ))}
                                </>
                              )}
                              
                              {/* All Other Languages */}
                              {other.length > 0 && (
                                <>
                                  {recent.length > 0 && (
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                      All Languages
                                    </div>
                                  )}
                                  {other.map((lang) => (
                                    <button
                                      key={lang}
                                      onClick={() => {
                                        setSourceLanguage(lang);
                                        saveToRecent(lang);
                                        setSourceDropdownOpen(false);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors duration-150 text-gray-700 font-medium"
                                    >
                                      {lang}
                                    </button>
                                  ))}
                                </>
                              )}
                            </>
                          );
                        })()}
                      </div>
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
                    onClick={() => {
                      setTargetDropdownOpen(!targetDropdownOpen);
                      setTargetSearchQuery('');
                    }}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-left focus:border-blue-500 focus:ring-0 transition-all duration-200 hover:border-gray-300 text-gray-700 font-medium flex items-center justify-between"
                  >
                    <span>{targetLanguage}</span>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${targetDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {targetDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 max-h-80 overflow-hidden flex flex-col">
                      {/* Search Input */}
                      <div className="px-3 py-2 border-b border-gray-200 sticky top-0 bg-white">
                        <input
                          type="text"
                          placeholder="Search languages..."
                          value={targetSearchQuery}
                          onChange={(e) => setTargetSearchQuery(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      {/* Language List - Scrollable */}
                      <div className="overflow-y-auto max-h-64">
                        {(() => {
                          const { recent, other } = getFilteredLanguages(targetSearchQuery);
                          const hasResults = recent.length > 0 || other.length > 0;
                          
                          if (!hasResults) {
                            return (
                              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                                No languages found
                              </div>
                            );
                          }
                          
                          return (
                            <>
                              {/* Recent Languages */}
                              {recent.length > 0 && (
                                <>
                                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                    Recent
                                  </div>
                                  {recent.map((lang) => (
                                    <button
                                      key={lang}
                                      onClick={() => {
                                        setTargetLanguage(lang);
                                        saveToRecent(lang);
                                        setTargetDropdownOpen(false);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors duration-150 text-gray-700 font-medium"
                                    >
                                      <span className="text-blue-600">⭐</span> {lang}
                                    </button>
                                  ))}
                                </>
                              )}
                              
                              {/* All Other Languages */}
                              {other.length > 0 && (
                                <>
                                  {recent.length > 0 && (
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                                      All Languages
                                    </div>
                                  )}
                                  {other.map((lang) => (
                                    <button
                                      key={lang}
                                      onClick={() => {
                                        setTargetLanguage(lang);
                                        saveToRecent(lang);
                                        setTargetDropdownOpen(false);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors duration-150 text-gray-700 font-medium"
                                    >
                                      {lang}
                                    </button>
                                  ))}
                                </>
                              )}
                            </>
                          );
                        })()}
                      </div>
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
                {wordCount} words
              </div>
            </div>
            
            {/* AI Generation Error Message */}
            {generationError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">{generationError}</p>
                  <button
                    onClick={() => setGenerationError(null)}
                    className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* AI Generation Progress */}
            {isGenerating && generationProgress.total > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">
                    Generating sentences with AI...
                  </span>
                  <span className="text-sm text-blue-600">
                    {generationProgress.current} / {generationProgress.total}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {!isGenerating && generationProgress.current > 0 && generationProgress.current === generationProgress.total && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium text-green-800">
                  ✨ Successfully generated {generationProgress.total} sentences!
                </p>
              </div>
            )}
            
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              {/* AI Process Words Button */}
              <button
                onClick={handleProcessWords}
                disabled={isGenerating || !words.trim()}
                className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center w-full sm:w-auto justify-center"
              >
                {isGenerating ? (
                  <>
                    <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Process Words with AI
                  </>
                )}
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
              {processedWords.length > 0 ? `Preview: ${processedWords.length} Enriched Words` : 'Preview: Enriched Word Cards'}
            </h2>
            
            {processedWords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedWords.map((wordData, index) => (
                  <div key={index} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
                    
                    {/* Image Placeholder (for Phase 3D - Google Custom Search) */}
                    <div className="mb-6">
                      <div className="relative group">
                        <div className="w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs font-medium">Image (Phase 3D)</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button disabled className="text-xs px-3 py-1 bg-gray-100 text-gray-400 rounded-full cursor-not-allowed font-medium">
                          Next Image
                        </button>
                        <button disabled className="text-xs px-3 py-1 bg-gray-100 text-gray-400 rounded-full cursor-not-allowed font-medium">
                          Upload Custom
                        </button>
                      </div>
                    </div>

                    {/* Word */}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                        {wordData.word}
                      </h3>
                      <p className="text-lg text-blue-600 text-center font-medium">
                        {wordData.translation}
                      </p>
                    </div>

                    {/* Sentence in source language */}
                    <div className="mb-4">
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-gray-700 italic text-center leading-relaxed text-sm">
                          "{wordData.sentence}"
                        </p>
                      </div>
                    </div>

                    {/* Sentence translation */}
                    <div className="mb-4">
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <p className="text-gray-600 text-center leading-relaxed text-sm">
                          "{wordData.sentenceTranslation}"
                        </p>
                      </div>
                    </div>

                    {/* Audio button */}
                    <div className="text-center">
                      <button 
                        onClick={() => handlePlayPronunciation(wordData.word, sourceLanguage)}
                        className="group bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white p-3 rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <p className="text-xs text-gray-600 mt-2 font-medium">Play pronunciation</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-w-md">
                <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 shadow-md">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <p className="text-lg font-medium mb-2">No words processed yet</p>
                    <p className="text-sm">Add words and click "Process Words with AI" to see enriched cards here</p>
                  </div>
                </div>
              </div>
            )}
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