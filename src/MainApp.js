import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Dashboard from './components/Dashboard';
import SetEditor from './components/SetEditor';
import SetViewer from './components/SetViewer';
import {
  useGroups,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useSets,
  useCreateSet,
  useUpdateSet,
  useDeleteSet,
  useWords,
  useCreateWord,
  useUpdateWord,
  useDeleteWord,
} from './hooks/useDatabase';

function App() {
  const queryClient = useQueryClient();
  
  // Ref to track unsaved changes from SetViewer
  const hasUnsavedChangesRef = useRef(false);
  
  // First time load setup
  useEffect(() => {
    // Check if this is the first load (based on a flag)
    const hasLoadedBefore = localStorage.getItem('hasLoadedBefore');
    if (!hasLoadedBefore) {
      // Set flag to prevent clearing on refresh
      localStorage.setItem('hasLoadedBefore', 'true');
    }
  }, []);
  
  // Fetch data from database
  const { data: groupsData = [], isLoading: groupsLoading, error: groupsError } = useGroups();
  const { data: setsData = [], isLoading: setsLoading, error: setsError } = useSets();
  
  // Combined loading state
  const isLoading = groupsLoading || setsLoading;
  const error = groupsError || setsError;

  // Mutations
  const createGroupMutation = useCreateGroup();
  const updateGroupMutation = useUpdateGroup();
  const deleteGroupMutation = useDeleteGroup();
  const createSetMutation = useCreateSet();
  const updateSetMutation = useUpdateSet();
  const deleteSetMutation = useDeleteSet();
  const createWordMutation = useCreateWord();
  const updateWordMutation = useUpdateWord();
  const deleteWordMutation = useDeleteWord();

  // Combine groups with their sets
  const groups = useMemo(() => {
    return groupsData.map(group => ({
      ...group,
      sets: setsData.filter(set => set.group_id === group.id)
    }));
  }, [groupsData, setsData]);

  // Flatten sets for backward compatibility with existing code
  const mockSets = useMemo(() => {
    return groups.flatMap(group => 
      group.sets.map(set => ({ 
        ...set, 
        groupId: group.id, 
        groupName: group.name,
        words: set.words || [],
        word_count: set.word_count || 0,
        wordCount: set.word_count || 0
      }))
    );
  }, [groups]);

  // Initialize state from localStorage or defaults
  const [currentView, setCurrentView] = useState(() => {
    const saved = localStorage.getItem('currentView');
    return saved ? JSON.parse(saved) : { name: 'dashboard' };
  });
  
  const [activeSet, setActiveSet] = useState(() => {
    const saved = localStorage.getItem('activeSet');
    // Only restore minimal data (id, name) without words to force fresh fetch
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        id: parsed.id,
        name: parsed.name,
        group_id: parsed.group_id,
        groupName: parsed.groupName,
        word_count: parsed.word_count
        // Intentionally not restoring words to ensure fresh data on reload
      };
    }
    return null;
  });
  
  const [viewMode, setViewMode] = useState(localStorage.getItem('viewMode') || 'list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Progress notification state
  const [progressNotification, setProgressNotification] = useState(null);
  
  // Upload cancellation and active upload tracking
  const uploadCancelledRef = useRef(false);
  const uploadInProgressRef = useRef(false);
  const [uploadInProgress, setUploadInProgress] = useState(false); // State for reactivity
  const hasCheckedResumeRef = useRef(false);
  
  // Browser back confirmation state
  const [showBrowserBackConfirm, setShowBrowserBackConfirm] = useState(false);
  const pendingNavigationRef = useRef(null);

  // Sync activeSet with mockSets when data updates (for real-time updates during upload)
  useEffect(() => {
    const activeSetId = activeSet?.id;
    if (activeSetId && mockSets.length > 0 && currentView.name === 'viewer') {
      const updatedSet = mockSets.find(s => s.id === activeSetId);
      if (updatedSet) {
        const wordCountChanged = updatedSet.word_count !== activeSet.word_count;
        const wordsMismatch = updatedSet.word_count > 0 && 
                             (!activeSet.words || activeSet.words.length !== updatedSet.word_count);
        
        // Check if we have temp cards (unsaved new cards)
        const hasTempCards = activeSet.words && activeSet.words.some(w => w.id && w.id.startsWith('temp-'));
        
        if ((wordCountChanged || wordsMismatch) && !hasTempCards) {
          // Only sync from database if we don't have unsaved temp cards
          console.log('📡 Syncing activeSet from database (no temp cards)');
          // Fetch fresh words from database
          import('./services/words').then(({ fetchWordsBySet }) => {
            fetchWordsBySet(activeSetId).then(wordsData => {
              setActiveSet({
                ...updatedSet,
                words: wordsData || []
              });
            }).catch(err => {
              console.error('Failed to fetch words for sync:', err);
            });
          });
        } else if (hasTempCards) {
          console.log('⏸️ Skipping database sync - have unsaved temp cards');
        }
      }
    }
  }, [mockSets, activeSet]); // Depend on both mockSets and activeSet for proper sync

  // Persist currentView and activeSet to localStorage
  useEffect(() => {
    localStorage.setItem('currentView', JSON.stringify(currentView));
    
    // Push state to browser history for back/forward button support
    const state = { view: currentView.name, setId: activeSet?.id };
    const title = currentView.name === 'dashboard' ? 'Dashboard' : 
                  currentView.name === 'editor' ? 'New Set' :
                  activeSet?.name || 'Set Viewer';
    
    // Only push state if it's different from current state
    if (JSON.stringify(window.history.state) !== JSON.stringify(state)) {
      window.history.pushState(state, title, window.location.pathname);
    }
  }, [currentView, activeSet]);

  useEffect(() => {
    if (activeSet) {
      // Only save minimal data to avoid localStorage quota issues
      const minimalSet = {
        id: activeSet.id,
        name: activeSet.name,
        group_id: activeSet.group_id,
        groupName: activeSet.groupName,
        word_count: activeSet.word_count
      };
      localStorage.setItem('activeSet', JSON.stringify(minimalSet));
    } else {
      localStorage.removeItem('activeSet');
    }
  }, [activeSet]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = async (event) => {
      // Check if there are unsaved changes
      if (hasUnsavedChangesRef.current) {
        // Prevent navigation and show custom confirmation
        pendingNavigationRef.current = event.state;
        setShowBrowserBackConfirm(true);
        
        // Push the current state back to keep user on the page
        const currentState = { view: currentView.name, setId: activeSet?.id };
        window.history.pushState(currentState, '', window.location.pathname);
        return;
      }
      
      // No unsaved changes, proceed with navigation
      await performNavigation(event.state);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mockSets, currentView, activeSet]);
  
  // Helper function to perform navigation
  const performNavigation = async (state) => {
    if (state) {
      const { view, setId } = state;
      
      if (view === 'dashboard') {
        setCurrentView({ name: 'dashboard' });
        setActiveSet(null);
      } else if (view === 'editor') {
        setCurrentView({ name: 'editor' });
      } else if (view === 'viewer' && setId) {
        // Load the set
        const selectedSet = mockSets.find(set => set.id === setId);
        if (selectedSet) {
          try {
            const { fetchWordsBySet } = await import('./services/words');
            const wordsData = await fetchWordsBySet(setId);
            
            setActiveSet({
              ...selectedSet,
              words: wordsData || []
            });
            setCurrentView({ name: 'viewer' });
          } catch (err) {
            console.error('Failed to fetch words:', err);
            setActiveSet({
              ...selectedSet,
              words: []
            });
            setCurrentView({ name: 'viewer' });
          }
        }
      }
    }
  };
  
  // Handle browser back confirmation
  const handleConfirmBrowserBack = async () => {
    hasUnsavedChangesRef.current = false; // Reset the flag
    setShowBrowserBackConfirm(false);
    
    // Perform the pending navigation
    if (pendingNavigationRef.current) {
      await performNavigation(pendingNavigationRef.current);
      pendingNavigationRef.current = null;
    }
  };
  
  const handleCancelBrowserBack = () => {
    setShowBrowserBackConfirm(false);
    pendingNavigationRef.current = null;
  };

  // Restore activeSet with full data on mount if returning from refresh
  useEffect(() => {
    const restoreSet = async () => {
      const saved = localStorage.getItem('activeSet');
      if (saved && currentView.name === 'viewer' && !isLoading) {
        const minimalSet = JSON.parse(saved);
        // Always fetch fresh data from database on reload to discard unsaved changes
        if (minimalSet.id && activeSet && !activeSet.words) {
          // Invalidate query cache to ensure fresh data
          queryClient.invalidateQueries({ queryKey: ['words', minimalSet.id] });
          
          const selectedSet = mockSets.find(set => set.id === minimalSet.id);
          if (selectedSet) {
            try {
              const { fetchWordsBySet } = await import('./services/words');
              const wordsData = await fetchWordsBySet(minimalSet.id);
              
              setActiveSet({
                ...selectedSet,
                words: wordsData || []
              });
            } catch (err) {
              console.error('Failed to fetch words:', err);
              setActiveSet({
                ...selectedSet,
                words: []
              });
            }
          }
        }
      }
    };
    
    // Set initial history state on first load
    if (!window.history.state) {
      const initialState = { view: currentView.name, setId: activeSet?.id };
      window.history.replaceState(initialState, '', window.location.pathname);
    }
    
    restoreSet();
  }, [isLoading, mockSets]); // Run when data is loaded

  // Reset scroll position when view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView.name]);
  
  // Check for incomplete uploads on mount and auto-resume
  useEffect(() => {
    const checkIncompleteUpload = async () => {
      console.log('🔍 Checking for incomplete uploads...', {
        isLoading,
        mockSetsLength: mockSets.length,
        uploadInProgress: uploadInProgressRef.current,
        hasChecked: hasCheckedResumeRef.current
      });
      
      // Only check once when data is loaded and no upload is in progress
      if (isLoading || !mockSets.length || uploadInProgressRef.current) {
        return;
      }
      
      const uploadQueue = localStorage.getItem('uploadQueue');
      if (!uploadQueue) {
        hasCheckedResumeRef.current = true;
        console.log('✅ No upload queue found');
        return;
      }
      
      // If we've already checked and there's still a queue, it means we're resuming
      // Don't block subsequent checks
      if (hasCheckedResumeRef.current) {
        console.log('⚠️ Already checked, skipping');
        return;
      }
      
      hasCheckedResumeRef.current = true;
      
      console.log('📦 Found upload queue, checking...');
      
      const queueData = JSON.parse(uploadQueue);
      const timeSinceStart = Date.now() - queueData.timestamp;
      const oneHour = 60 * 60 * 1000;
      
      // Only resume if less than 1 hour old
      if (timeSinceStart >= oneHour) {
        console.log('Upload queue too old, clearing...');
        localStorage.removeItem('uploadQueue');
        return;
      }
      
      // Check if there are any unuploaded words
      const unuploadedWords = queueData.words.filter(w => !w.uploaded);
      if (unuploadedWords.length === 0) {
        console.log('All words uploaded, clearing queue');
        localStorage.removeItem('uploadQueue');
        localStorage.removeItem('editorBackup');
        return;
      }
      
      console.log(`Detected incomplete upload: ${unuploadedWords.length} words remaining`);
      
      // Find the set
      const selectedSet = mockSets.find(set => set.id === queueData.setId);
      if (!selectedSet) {
        console.log('Set not found, clearing queue');
        localStorage.removeItem('uploadQueue');
        return;
      }
      
      // Fetch current words from database
      try {
        const { fetchWordsBySet } = await import('./services/words');
        const currentWords = await fetchWordsBySet(queueData.setId);
        
        // Update activeSet but DON'T change the view - let user stay where they are
        setActiveSet({
          ...selectedSet,
          words: currentWords || [],
          groupId: selectedSet.group_id,
          groupName: groups.find(g => g.id === selectedSet.group_id)?.name || ''
        });
        
        // Resume the upload in background
        resumeUploadFromQueue(queueData, currentWords || []);
      } catch (err) {
        console.error('Failed to resume upload:', err);
      }
    };
    
    // Run once after data is loaded
    checkIncompleteUpload();
  }, [isLoading, mockSets, groups]); // Run when data is loaded

  // Store the selected group ID for new sets
  const [selectedGroupForNewSet, setSelectedGroupForNewSet] = useState(null);

  const handleCreateNewSet = (groupId) => {
    console.log('handleCreateNewSet called with groupId:', groupId);
    
    // Ensure groupId is valid (not an event object)
    const validGroupId = (groupId && typeof groupId !== 'object' && typeof groupId !== 'function') 
      ? groupId 
      : null;
    
    // Clear any corrupted backup
    localStorage.removeItem('editorBackup');
    
    // Store the selected group ID separately
    setSelectedGroupForNewSet(validGroupId);
    
    // If groupId is provided, pre-select that group for the new set
    setActiveSet({ 
      name: 'New Set', 
      words: []
    });
    setCurrentView({ name: 'editor' });
  };

  const handleOpenSet = async (setId) => {
    // Don't try to open sets with temporary IDs
    if (setId && setId.toString().startsWith('temp-')) {
      console.warn('Cannot open set with temporary ID. Please wait for set to be created.');
      return;
    }
    
    const selectedSet = mockSets.find(set => set.id === setId);
    if (selectedSet) {
      // Fetch words from database
      try {
        const { fetchWordsBySet } = await import('./services/words');
        const wordsData = await fetchWordsBySet(setId);
        
        // Ensure set has a words array with fetched data
        setActiveSet({
          ...selectedSet,
          words: wordsData || []
        });
        setCurrentView({ name: 'viewer' });
      } catch (err) {
        console.error('Failed to fetch words:', err);
        // Still open the set with empty words array
        setActiveSet({
          ...selectedSet,
          words: []
        });
        setCurrentView({ name: 'viewer' });
      }
    }
  };

  const handleDeleteSet = (setId) => {
    // Check if there's an ongoing upload for this set
    const uploadQueue = localStorage.getItem('uploadQueue');
    if (uploadQueue) {
      const queueData = JSON.parse(uploadQueue);
      if (queueData.setId === setId) {
        console.log('Cancelling ongoing upload for deleted set');
        uploadCancelledRef.current = true;
        localStorage.removeItem('uploadQueue');
        localStorage.removeItem('editorBackup');
        setProgressNotification(null);
      }
    }
    
    // Use mutate for instant UI updates
    deleteSetMutation.mutate(
      setId,
      {
        onError: (err) => {
          console.error('Failed to delete set:', err);
          alert('Failed to delete set. Please try again.');
        }
      }
    );
  };

  const handleUpdateSet = (updatedSet) => {
    console.log('📦 handleUpdateSet called in MainApp');
    console.log('Received updatedSet.id:', updatedSet?.id, 'name:', updatedSet?.name);
    console.log('Current activeSet.id:', activeSet?.id, 'name:', activeSet?.name);
    
    setActiveSet(updatedSet);
    
    console.log('Called setActiveSet with new data');
    
    // Update in database if it exists (has an ID)
    if (updatedSet.id) {
      updateSetMutation.mutate({
        setId: updatedSet.id,
        updates: {
          name: updatedSet.name,
          group_id: updatedSet.group_id,
          source_language: updatedSet.source_language,
          target_language: updatedSet.target_language
        }
      });
    }
  };

  const handleUpdateWord = (wordId, updates, setId) => {
    // Use mutate (non-blocking) for instant UI updates via optimistic update
    updateWordMutation.mutate(
      { wordId, updates, setId },
      {
        onSuccess: (updatedWord) => {
          // Update activeSet with the updated word from response
          if (activeSet && activeSet.id === setId) {
            setActiveSet(prev => ({
              ...prev,
              words: prev.words.map(w => w.id === wordId ? { ...w, ...updatedWord } : w)
            }));
          }
        },
        onError: (err) => {
          console.error('Failed to update word:', err);
          alert('Failed to update word. Please try again.');
        }
      }
    );
  };

  const handleCreateWord = async (wordData) => {
    try {
      const newWord = await createWordMutation.mutateAsync(wordData);
      // Return the created word - SetViewer will handle updating the UI
      // Don't update activeSet here to avoid race conditions with SetViewer's state management
      return newWord;
    } catch (err) {
      console.error('Failed to create word:', err);
      alert('Failed to create word. Please try again.');
      throw err;
    }
  };

  const handleDeleteWord = (wordId, setId) => {
    // Use mutate (non-blocking) for instant UI updates
    deleteWordMutation.mutate(
      { wordId, setId },
      {
        onSuccess: () => {
          // Optimistic update already handled, just update local state
          setActiveSet(prev => ({
            ...prev,
            words: prev.words.filter(w => w.id !== wordId)
          }));
        },
        onError: (err) => {
          console.error('Failed to delete word:', err);
          alert('Failed to delete word. Please try again.');
        }
      }
    );
  };
  
  // Cancel upload function
  const handleCancelUpload = () => {
    console.log('Upload cancelled by user');
    uploadCancelledRef.current = true;
    uploadInProgressRef.current = false;
    
    // Clear queue and backup
    localStorage.removeItem('uploadQueue');
    localStorage.removeItem('editorBackup');
    
    // Hide progress notification immediately
    setProgressNotification(null);
  };

  // Resume upload from queue
  const resumeUploadFromQueue = async (queueData, currentWords) => {
    // Prevent multiple simultaneous uploads
    if (uploadInProgressRef.current) {
      console.log('Upload already in progress, skipping duplicate start');
      return;
    }
    
    uploadInProgressRef.current = true;
    uploadCancelledRef.current = false; // Reset cancel flag
    console.log('Resuming upload from queue');
    
    // Read fresh queue data from localStorage
    let currentQueue = JSON.parse(localStorage.getItem('uploadQueue'));
    if (!currentQueue) {
      console.log('No queue found, stopping');
      uploadInProgressRef.current = false;
      return;
    }
    
    // Filter out already uploaded words
    const unuploadedWords = currentQueue.words.filter(w => !w.uploaded);
    const uploadedCount = currentQueue.words.filter(w => w.uploaded).length;
    
    if (unuploadedWords.length === 0) {
      console.log('All words uploaded');
      localStorage.removeItem('uploadQueue');
      localStorage.removeItem('editorBackup');
      uploadInProgressRef.current = false;
      return;
    }
    
    console.log(`Resuming: ${uploadedCount} uploaded, ${unuploadedWords.length} remaining`);
    
    // Parse unuploaded words for creation - include sentence data if available
    const wordsToCreate = unuploadedWords.map(queueWord => ({
      set_id: currentQueue.setId,
      word: queueWord.word,
      translation: queueWord.translation,
      sentence: queueWord.sentence || null,
      sentence_translation: queueWord.sentenceTranslation || null,
      example: null,
      image_url: null,
      pronunciation: null,
      synonyms: [],
      antonyms: [],
      tags: []
    }));
    
    // Create batches
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < wordsToCreate.length; i += batchSize) {
      batches.push(wordsToCreate.slice(i, i + batchSize));
    }
    
    const startTime = Date.now();
    
    // Show progress notification using uploaded count from queue
    setProgressNotification({
      total: currentQueue.totalWords,
      current: uploadedCount,
      message: `Resuming upload... (${uploadedCount}/${currentQueue.totalWords})`
    });
    
    // Process batches
    const processBatches = async () => {
      let currentQueue; // Declare here so it's accessible throughout the loop
      
      for (let i = 0; i < batches.length; i++) {
        // Check if upload was cancelled
        if (uploadCancelledRef.current) {
          console.log('Upload cancelled, stopping batch processing');
          uploadCancelledRef.current = false; // Reset flag
          uploadInProgressRef.current = false; // Mark upload as complete
          return;
        }
        
        const batch = batches[i];
        console.log(`Processing batch ${i + 1}/${batches.length}...`);
        
        try {
          // CRITICAL: Read fresh queue from localStorage BEFORE processing
          currentQueue = JSON.parse(localStorage.getItem('uploadQueue'));
          if (!currentQueue) {
            console.log('Queue was cleared, stopping upload');
            return;
          }
          
          // Count uploaded words for progress display
          const uploadedCount = currentQueue.words.filter(w => w.uploaded).length;
          
          const batchPromises = batch.map(wordData =>
            createWordMutation.mutateAsync(wordData).catch(err => {
              console.error('Failed to create word:', wordData.word, err);
              return null;
            })
          );
          
          const results = await Promise.all(batchPromises);
          const successfulWords = results.filter(r => r !== null);
          
          // Read fresh queue again after upload
          currentQueue = JSON.parse(localStorage.getItem('uploadQueue'));
          if (!currentQueue) {
            console.log('Queue was cleared, stopping upload');
            return;
          }
          
          // Update queue - mark words as uploaded
          successfulWords.forEach(wordResult => {
            const queueItem = currentQueue.words.find(w => 
              w.word === wordResult.word && !w.uploaded
            );
            if (queueItem) {
              queueItem.uploaded = true;
              queueItem.wordId = wordResult.id;
            }
          });
          
          // Save updated queue back to localStorage
          localStorage.setItem('uploadQueue', JSON.stringify(currentQueue));
          
          // Refetch after every batch for real-time UI updates
          // This ensures words appear after each 10 words (or remainder if last batch)
          await queryClient.refetchQueries({ 
            queryKey: ['words', currentQueue.setId],
            type: 'active'
          });
          
          // Update progress notification
          setProgressNotification({
            total: currentQueue.totalWords,
            current: uploadedCount + batch.length,
            message: `Adding words to your set... (${uploadedCount + batch.length}/${currentQueue.totalWords})`
          });
        } catch (err) {
          console.error('Batch failed:', err);
        }
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // Read final queue state
      const finalQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      const finalUploadedCount = finalQueue ? finalQueue.words.filter(w => w.uploaded).length : 0;
      
      console.log(`✓ Upload complete: ${finalUploadedCount}/${finalQueue?.totalWords || 0} words in ${duration}s`);
      
      // Clear upload queue and editor backup
      localStorage.removeItem('uploadQueue');
      localStorage.removeItem('editorBackup');
      
      // Mark upload as complete
      uploadInProgressRef.current = false;
      
      // Final refetch to refresh the set data with accurate counts
      // Use refetchQueries for immediate update (not invalidateQueries)
      console.log('🔄 Final refetch to display all words...');
      await Promise.all([
        queryClient.refetchQueries({ 
          queryKey: ['words', currentQueue.setId],
          type: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: ['sets'],
          type: 'active'
        })
      ]);
      
      console.log('✅ Final refetch complete - all words should be visible');
      
      // Hide progress notification
      setTimeout(() => {
        setProgressNotification(null);
      }, 2000);
    };
    
    processBatches().catch(err => {
      console.error('Failed to resume upload:', err);
      setProgressNotification(null);
      uploadInProgressRef.current = false;
    });
  };

  const handleSaveNewSet = async (newSet, targetGroupId = null) => {
    // Clear the selected group for new set
    setSelectedGroupForNewSet(null);
    
    // Save selected languages to localStorage for future use
    const saveLanguageToRecent = (language) => {
      if (!language || language.trim() === '') return;
      
      // Get recent languages from localStorage
      const recentInStorage = localStorage.getItem('recentLanguages');
      let recent = recentInStorage ? JSON.parse(recentInStorage) : [];
      
      // Remove if already exists
      recent = recent.filter(lang => lang !== language);
      // Add to beginning
      recent.unshift(language);
      // Keep only top 5
      recent = recent.slice(0, 5);
      localStorage.setItem('recentLanguages', JSON.stringify(recent));
    };
    
    // Save both source and target languages
    if (newSet.source_language) {
      saveLanguageToRecent(newSet.source_language);
    }
    if (newSet.target_language) {
      saveLanguageToRecent(newSet.target_language);
    }
    
    console.log('🚀 handleSaveNewSet called with:', {
      newSetName: newSet?.name,
      wordsCount: newSet?.words?.length,
      targetGroupId,
      targetGroupIdType: typeof targetGroupId,
      isObject: typeof targetGroupId === 'object',
      isNull: targetGroupId === null
    });
    
    if (newSet.name.trim()) {
      try {
        // Determine which group to add to
        let groupId = targetGroupId;
        
        // Check if targetGroupId is a temp ID - if so, treat as no group
        if (groupId && groupId.toString().startsWith('temp-')) {
          groupId = null;
        }
        
        // If no target group and no groups exist, create a default group first
        if (!groupId && groups.length === 0) {
          const newGroup = await createGroupMutation.mutateAsync({
            name: "My Vocabulary Sets",
            color: "blue"
          });
          groupId = newGroup.id;
        }
        
        // If still no group, use first real group (skip temp groups)
        if (!groupId) {
          const realGroup = groups.find(g => !g.id.toString().startsWith('temp-'));
          if (realGroup) {
            groupId = realGroup.id;
          } else {
            // All groups are temp, create a real one
            const newGroup = await createGroupMutation.mutateAsync({
              name: "My Vocabulary Sets",
              color: "blue"
            });
            groupId = newGroup.id;
          }
        }

        // Create the set first (wait for it to get real ID)
        console.log('🔍 About to create set with clean data:', {
          group_id: groupId,
          name: newSet.name,
          source_language: newSet.source_language || 'Auto-detect',
          target_language: newSet.target_language || 'English',
          wordsCount: newSet?.words?.length
        });
        
        const createdSet = await createSetMutation.mutateAsync({
          group_id: groupId,
          name: newSet.name,
          source_language: newSet.source_language || 'Auto-detect',
          target_language: newSet.target_language || 'English'
        });
        
        // Parse all words and create upload queue - handle both string and object formats
        const wordCount = newSet.words.filter(w => typeof w === 'string' ? w.trim() : w).length;
        const wordsQueue = newSet.words
          .filter(wordLine => typeof wordLine === 'string' ? wordLine.trim() : wordLine)
          .map((wordLine, index) => {
            // Check if it's already an enriched object from AI processing
            if (typeof wordLine === 'object' && wordLine.word) {
              return {
                id: `word_${index}`,
                word: wordLine.word,
                translation: wordLine.translation || '',
                sentence: wordLine.sentence || null,
                sentenceTranslation: wordLine.sentenceTranslation || null,
                image: wordLine.image || null, // Include image
                uploaded: false,
                wordId: null
              };
            }
            
            // Otherwise parse the old string format
            const parts = wordLine.split('|').map(p => p.trim());
            const wordText = parts[0];
            const translation = parts[1] || '';
            
            return {
              id: `word_${index}`,
              word: wordText,
              translation: translation,
              uploaded: false,
              wordId: null // Will be filled after upload
            };
          });

        // Save upload queue to localStorage
        const uploadQueue = {
          setId: createdSet.id,
          setName: createdSet.name,
          groupId: groupId,
          timestamp: Date.now(),
          totalWords: wordCount,
          words: wordsQueue
        };
        localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));
        console.log('Upload queue saved to localStorage');

        // Navigate to the newly created set immediately
        // Set it up with empty words array - they'll populate in real-time
        console.log('Navigating to new set...');
        const newSetWithWords = {
          ...createdSet,
          words: [],
          groupId: groupId,
          groupName: groups.find(g => g.id === groupId)?.name || ''
        };
        setActiveSet(newSetWithWords);
        setCurrentView({ name: 'viewer' });

        // Create words in background if any - use batched parallel execution
        if (newSet.words && newSet.words.length > 0) {
          const wordCount = newSet.words.filter(w => typeof w === 'string' ? w.trim() : w).length;
          console.log('Creating', wordCount, 'words in batches...');
          const startTime = Date.now();
          
          // Parse all words first - handle both string format and object format
          const parsedWords = newSet.words
            .filter(wordLine => typeof wordLine === 'string' ? wordLine.trim() : wordLine)
            .map(wordLine => {
              // Check if it's already an enriched object from AI processing
              if (typeof wordLine === 'object' && wordLine.word) {
                return {
                  set_id: createdSet.id,
                  word: wordLine.word,
                  translation: wordLine.translation || '',
                  sentence: wordLine.sentence || null,
                  sentence_translation: wordLine.sentenceTranslation || null,
                  example: null,
                  image_url: wordLine.image || null, // Include image from AI processing
                  pronunciation: null,
                  synonyms: [],
                  antonyms: [],
                  tags: []
                };
              }
              
              // Otherwise parse the old string format: "word|translation" or just "word"
              const parts = wordLine.split('|').map(p => p.trim());
              const wordText = parts[0];
              const translation = parts[1] || '';
              
              if (wordText) {
                return {
                  set_id: createdSet.id,
                  word: wordText,
                  translation: translation,
                  sentence: null,
                  sentence_translation: null,
                  example: null,
                  image_url: null,
                  pronunciation: null,
                  synonyms: [],
                  antonyms: [],
                  tags: []
                };
              }
              return null;
            })
            .filter(Boolean);

          // Create words in batches of 10 for better performance
          const batchSize = 10;
          const batches = [];
          for (let i = 0; i < parsedWords.length; i += batchSize) {
            batches.push(parsedWords.slice(i, i + batchSize));
          }

          // Show progress notification
          setProgressNotification({
            total: wordCount,
            current: 0,
            message: 'Adding words to your set...'
          });
          
          // Mark upload as in progress BEFORE starting batches
          uploadInProgressRef.current = true;
          setUploadInProgress(true);
          
          // Reset cancel flag
          uploadCancelledRef.current = false;

          // Process batches sequentially, but words within each batch in parallel
          const processBatches = async () => {
            for (let i = 0; i < batches.length; i++) {
              // Check if upload was cancelled
              if (uploadCancelledRef.current) {
                console.log('Upload cancelled, stopping batch processing');
                uploadCancelledRef.current = false; // Reset flag
                uploadInProgressRef.current = false; // Mark upload as complete
                setUploadInProgress(false);
                return;
              }
              
              const batch = batches[i];
              console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} words)...`);
              
              try {
                // CRITICAL: Read fresh queue from localStorage BEFORE processing
                let currentQueue = JSON.parse(localStorage.getItem('uploadQueue'));
                if (!currentQueue) {
                  console.log('Queue was cleared, stopping upload');
                  return;
                }
                
                // Count uploaded words for progress display
                const uploadedCount = currentQueue.words.filter(w => w.uploaded).length;
                
                const batchPromises = batch.map(wordData =>
                  createWordMutation.mutateAsync(wordData).catch(err => {
                    console.error('Failed to create word:', wordData.word, err);
                    return null;
                  })
                );
                
                const results = await Promise.all(batchPromises);
                const successfulWords = results.filter(r => r !== null);
                
                // Read fresh queue again after upload
                currentQueue = JSON.parse(localStorage.getItem('uploadQueue'));
                if (!currentQueue) {
                  console.log('Queue was cleared, stopping upload');
                  return;
                }
                
                // Update upload queue - mark words as uploaded
                successfulWords.forEach(wordResult => {
                  const queueItem = currentQueue.words.find(w => 
                    w.word === wordResult.word && !w.uploaded
                  );
                  if (queueItem) {
                    queueItem.uploaded = true;
                    queueItem.wordId = wordResult.id;
                  }
                });
                
                // Save updated queue to localStorage
                localStorage.setItem('uploadQueue', JSON.stringify(currentQueue));
                
                // Refetch after every batch for real-time UI updates
                // This ensures words appear after each 10 words (or remainder if last batch)
                await queryClient.refetchQueries({ 
                  queryKey: ['words', createdSet.id],
                  type: 'active'
                });
                
                // Update progress notification
                setProgressNotification({
                  total: wordCount,
                  current: uploadedCount + batch.length,
                  message: `Adding words to your set... (${uploadedCount + batch.length}/${wordCount})`
                });
                
                console.log(`Batch ${i + 1} complete: ${successfulWords.length}/${batch.length} words created`);
              } catch (err) {
                console.error('Batch failed:', err);
              }
            }
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            
            // Read final queue state for completion log
            const finalQueue = JSON.parse(localStorage.getItem('uploadQueue'));
            const finalUploadedCount = finalQueue ? finalQueue.words.filter(w => w.uploaded).length : 0;
            
            console.log(`✓ Created ${finalUploadedCount}/${wordCount} words in ${duration}s`);
            
            // Clear upload queue - upload complete
            localStorage.removeItem('uploadQueue');
            // Also clear editor backup since set was created successfully
            localStorage.removeItem('editorBackup');
            
            // Final refetch to refresh UI with accurate database data
            // Use refetchQueries for immediate update (not invalidateQueries)
            console.log('🔄 Final refetch to display all words...');
            await Promise.all([
              queryClient.refetchQueries({ 
                queryKey: ['words', createdSet.id],
                type: 'active'
              }),
              queryClient.refetchQueries({ 
                queryKey: ['sets'],
                type: 'active'
              })
            ]);
            
            console.log('✅ Final refetch complete - all words should be visible');
            
            // Mark upload as complete AFTER refetch so SetViewer can sync one last time
            uploadInProgressRef.current = false;
            setUploadInProgress(false);
            console.log('✅ Upload complete - setting uploadInProgress to false');
            
            // Hide progress notification after completion
            setTimeout(() => {
              setProgressNotification(null);
            }, 2000);
          };

          // Execute batches in background - use setTimeout to ensure it runs after render
          console.log('🚀 Starting batch processing...');
          setTimeout(() => {
            processBatches().catch(err => {
              console.error('❌ Failed to create words:', err);
              setProgressNotification(null);
              uploadInProgressRef.current = false;
              setUploadInProgress(false);
              // Keep upload queue so user can retry
              alert('Upload failed: ' + err.message);
            });
          }, 100); // Small delay to ensure state is ready
        }
      } catch (err) {
        console.error('Failed to save set:', err);
        console.error('Error details:', {
          message: err?.message,
          stack: err?.stack,
          newSet: { name: newSet?.name, wordsCount: newSet?.words?.length }
        });
        alert('Failed to save set. Please try again. Error: ' + (err?.message || 'Unknown error'));
      }
    }
  };

  const handleCreateGroup = (groupData) => {
    // Use mutate (non-blocking) for instant UI updates
    createGroupMutation.mutate(
      {
        name: groupData.name || "New Group",
        color: groupData.color || "blue"
      },
      {
        onError: (err) => {
          console.error('Failed to create group:', err);
          alert('Failed to create group. Please try again.');
        }
      }
    );
  };

  const handleUpdateGroup = async (groupId, updatedData) => {
    // Special case for reordering groups
    if (groupId === 'reorder' && Array.isArray(updatedData)) {
      try {
        // Optimistically update the UI immediately
        queryClient.setQueryData(['groups'], updatedData);
        
        // Import the updateGroupsOrder function
        const { updateGroupsOrder } = await import('./services/groups');
        
        // Update all groups with their new display_order in background
        await updateGroupsOrder(updatedData);
        
        console.log('Groups reordered successfully!');
      } catch (err) {
        console.error('Failed to reorder groups:', err);
        // Refetch on error to restore correct state
        await queryClient.refetchQueries({ queryKey: ['groups'] });
        alert('Failed to save group order. Please try again.');
      }
      return;
    }
    
    // Regular group update - use mutate for instant UI
    updateGroupMutation.mutate(
      {
        groupId,
        updates: updatedData
      },
      {
        onError: (err) => {
          console.error('Failed to update group:', err);
          alert('Failed to update group. Please try again.');
        }
      }
    );
  };

  const handleDeleteGroup = (groupId) => {
    // Use mutate for instant UI updates
    deleteGroupMutation.mutate(
      groupId,
      {
        onError: (err) => {
          console.error('Failed to delete group:', err);
          alert('Failed to delete group. Please try again.');
        }
      }
    );
  };

  const handleMoveSetToGroup = async (setId, targetGroupId) => {
    try {
      await updateSetMutation.mutateAsync({
        setId,
        updates: { group_id: targetGroupId }
      });
    } catch (err) {
      console.error('Failed to move set:', err);
      alert('Failed to move set. Please try again.');
    }
  };

  const handleShowDashboard = () => {
    setActiveSet(null);
    setCurrentView({ name: 'dashboard' });
    setSearchTerm('');
  };

  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    localStorage.setItem('viewMode', newMode);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your vocabulary sets...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'An error occurred while loading your vocabulary sets.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {currentView.name === 'dashboard' && (
        <Dashboard 
          onCreateNewSet={handleCreateNewSet}
          onOpenSet={handleOpenSet}
          groups={groups}
          mockSets={mockSets}
          onCreateGroup={handleCreateGroup}
          onUpdateGroup={handleUpdateGroup}
          onDeleteGroup={handleDeleteGroup}
          onDeleteSet={handleDeleteSet}
          onMoveSetToGroup={handleMoveSetToGroup}
          isCreatingGroup={createGroupMutation.isPending}
          isUpdatingGroup={updateGroupMutation.isPending}
          isDeletingGroup={deleteGroupMutation.isPending}
          isCreatingSet={createSetMutation.isPending}
          isDeletingSet={deleteSetMutation.isPending}
        />
      )}
      {currentView.name === 'editor' && (
        <SetEditor 
          set={activeSet}
          defaultGroupId={selectedGroupForNewSet}
          onBack={() => {
            setSelectedGroupForNewSet(null); // Clear selected group on back
            handleShowDashboard();
          }}
          onUpdateSet={setActiveSet}
          onSaveSet={handleSaveNewSet}
          groups={groups}
          onCreateGroup={handleCreateGroup}
        />
      )}
      {currentView.name === 'viewer' && (
        <SetViewer
          set={activeSet}
          onBack={handleShowDashboard}
          onUpdateSet={handleUpdateSet}
          onDeleteSet={handleDeleteSet}
          onCreateWord={handleCreateWord}
          onUpdateWord={handleUpdateWord}
          onDeleteWord={handleDeleteWord}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isUpdatingWord={updateWordMutation.isPending}
          isDeletingWord={deleteWordMutation.isPending}
          uploadInProgress={uploadInProgress}
          onUnsavedChangesChange={(hasChanges) => {
            hasUnsavedChangesRef.current = hasChanges;
          }}
        />
      )}
      
      {/* Progress Notification Toast */}
      {progressNotification && (
        <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-white/90 backdrop-blur-md text-gray-800 px-4 sm:px-6 py-4 rounded-xl sm:rounded-2xl shadow-2xl border-2 border-blue-200/50 w-full sm:min-w-[380px] sm:max-w-md">
            {progressNotification.cancelled ? (
              /* Cancellation message */
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="font-semibold text-sm sm:text-base text-gray-900">
                  {progressNotification.message}
                </p>
              </div>
            ) : (
              <>
                {/* Header with icon and message */}
                <div className="flex items-center space-x-3 mb-3">
                  {/* Animated icon */}
                  <div className="flex-shrink-0">
                    {progressNotification.current === progressNotification.total ? (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="animate-spin w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Message text */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base text-gray-900">
                      {progressNotification.message}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {progressNotification.current} of {progressNotification.total} words
                    </p>
                  </div>
                  
                  {/* Percentage badge */}
                  <div className="flex-shrink-0">
                    <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-sm">
                      {Math.round((progressNotification.current / progressNotification.total) * 100)}%
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      width: `${(progressNotification.current / progressNotification.total) * 100}%` 
                    }}
                  />
                </div>
                
                {/* Cancel button - only show if not complete */}
                {progressNotification.current < progressNotification.total && (
                  <button
                    onClick={handleCancelUpload}
                    className="w-full py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors duration-200 text-sm"
                  >
                    Cancel Upload
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Browser Back Confirmation Modal */}
      {showBrowserBackConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Unsaved Changes
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  You have unsaved changes. Do you want to discard them and leave?
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancelBrowserBack}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBrowserBack}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
