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
          console.log('Creating default group...');
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

        // Create the set in database
        console.log('Creating set in database...');
        const createdSet = await createSetMutation.mutateAsync({
          group_id: groupId,
          name: newSet.name
        });
        console.log('Set created:', createdSet);

        // Create words if any - use Promise.all for parallel creation
        if (newSet.words && newSet.words.length > 0) {
          console.log('Creating words:', newSet.words.length);
          // Parse all words first
          const wordPromises = newSet.words
            .filter(wordLine => wordLine.trim())
            .map(wordLine => {
              // Parse the word line - expecting format: "word|translation" or just "word"
              const parts = wordLine.split('|').map(p => p.trim());
              const wordText = parts[0];
              const translation = parts[1] || '';
              
              if (wordText) {
                return createWordMutation.mutateAsync({
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
                });
              }
              return null;
            })
            .filter(Boolean);

          // Create all words in parallel for better performance
          await Promise.all(wordPromises);
          console.log('Words created successfully');
        }

        console.log('Navigating to dashboard...');
        setCurrentView({ name: 'dashboard' });
        setActiveSet(null);
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
        // Import the updateGroupsOrder function
        const { updateGroupsOrder } = await import('./services/groups');
        
        // Update all groups with their new display_order
        await updateGroupsOrder(updatedData);
        
        // Invalidate and refetch groups immediately
        await queryClient.invalidateQueries({ queryKey: ['groups'] });
        
        console.log('Groups reordered successfully!');
      } catch (err) {
        console.error('Failed to reorder groups:', err);
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
    </div>
  );
}

export default App;
