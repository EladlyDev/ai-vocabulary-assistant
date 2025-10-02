import React, { useState, useMemo } from 'react';
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
  
  // Fetch data from database
  const { data: groupsData = [], isLoading: groupsLoading, error: groupsError } = useGroups();
  const { data: setsData = [], isLoading: setsLoading, error: setsError } = useSets();

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
        words: set.words || [], // Ensure words array exists
        // Use word_count from database if available, fallback to words array length
        wordCount: set.word_count || (set.words?.length || 0)
      }))
    );
  }, [groups]);

  const [currentView, setCurrentView] = useState({ name: 'dashboard' });
  const [activeSet, setActiveSet] = useState(null);
  const [viewMode, setViewMode] = useState(localStorage.getItem('viewMode') || 'list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Progress notification state
  const [progressNotification, setProgressNotification] = useState(null);

  // Loading and error states
  const isLoading = groupsLoading || setsLoading;
  const error = groupsError || setsError;

  const handleCreateNewSet = () => {
    setActiveSet({ name: 'New Set', words: [] });
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
    setActiveSet(updatedSet);
    
    // Update in database if it exists (has an ID)
    if (updatedSet.id) {
      updateSetMutation.mutate({
        setId: updatedSet.id,
        updates: {
          name: updatedSet.name,
          group_id: updatedSet.group_id
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
      // React Query's optimistic update will handle the UI
      // Just update activeSet with the new word from the response
      if (activeSet && activeSet.id === wordData.set_id) {
        setActiveSet(prev => ({
          ...prev,
          words: [...(prev.words || []), newWord]
        }));
      }
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

  const handleSaveNewSet = async (newSet, targetGroupId = null) => {
    if (newSet.name.trim()) {
      try {
        console.log('Starting set creation...', newSet);
        
        // Determine which group to add to
        let groupId = targetGroupId;
        
        // If no target group and no groups exist, create a default group first
        if (!groupId && groups.length === 0) {
          console.log('No groups exist, creating default group...');
          const newGroup = await createGroupMutation.mutateAsync({
            name: "My Vocabulary Sets",
            color: "blue"
          });
          groupId = newGroup.id;
          console.log('Default group created:', groupId);
        }
        
        // If still no group, use first group
        if (!groupId) {
          groupId = groups[0].id;
          console.log('Using first group:', groupId);
        }

        // Create the set first (wait for it to get real ID)
        console.log('Creating set...');
        const createdSet = await createSetMutation.mutateAsync({
          group_id: groupId,
          name: newSet.name
        });
        console.log('Set created with ID:', createdSet.id);

        // Navigate to dashboard immediately after set is created
        // (don't wait for words - they'll populate in background)
        console.log('Navigating to dashboard...');
        setCurrentView({ name: 'dashboard' });
        setActiveSet(null);

        // Create words in background if any - use batched parallel execution
        if (newSet.words && newSet.words.length > 0) {
          const wordCount = newSet.words.filter(w => w.trim()).length;
          console.log('Creating', wordCount, 'words in batches...');
          const startTime = Date.now();
          
          // Parse all words first
          const wordsToCreate = newSet.words
            .filter(wordLine => wordLine.trim())
            .map(wordLine => {
              // Parse the word line - expecting format: "word|translation" or just "word"
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
          for (let i = 0; i < wordsToCreate.length; i += batchSize) {
            batches.push(wordsToCreate.slice(i, i + batchSize));
          }

          // Show progress notification
          setProgressNotification({
            total: wordCount,
            current: 0,
            message: 'Creating words...'
          });

          // Process batches sequentially, but words within each batch in parallel
          const processBatches = async () => {
            let totalCreated = 0;
            for (let i = 0; i < batches.length; i++) {
              const batch = batches[i];
              console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} words)...`);
              
              try {
                const batchPromises = batch.map(wordData =>
                  createWordMutation.mutateAsync(wordData).catch(err => {
                    console.error('Failed to create word:', wordData.word, err);
                    return null;
                  })
                );
                
                const results = await Promise.all(batchPromises);
                const successCount = results.filter(r => r !== null).length;
                totalCreated += successCount;
                
                // Update progress notification
                setProgressNotification({
                  total: wordCount,
                  current: totalCreated,
                  message: `Creating words... (${totalCreated}/${wordCount})`
                });
                
                console.log(`Batch ${i + 1} complete: ${successCount}/${batch.length} words created`);
              } catch (err) {
                console.error('Batch failed:', err);
              }
            }
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`✓ Created ${totalCreated}/${wordCount} words in ${duration}s`);
            
            // Hide progress notification after completion
            setTimeout(() => {
              setProgressNotification(null);
            }, 2000);
          };

          // Execute batches in background
          processBatches().catch(err => {
            console.error('Failed to create words:', err);
            setProgressNotification(null);
          });
        }
      } catch (err) {
        console.error('Failed to save set:', err);
        alert('Failed to save set. Please try again.');
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
          onBack={handleShowDashboard}
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
        />
      )}
      
      {/* Progress Notification Toast */}
      {progressNotification && (
        <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-white/90 backdrop-blur-md text-gray-800 px-4 sm:px-6 py-4 rounded-xl sm:rounded-2xl shadow-2xl border-2 border-blue-200/50 w-full sm:min-w-[380px] sm:max-w-md">
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
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                style={{ 
                  width: `${(progressNotification.current / progressNotification.total) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
