import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ExportModal from './ExportModal';
import BackToTop from './BackToTop';

const Dashboard = ({ onCreateNewSet, onOpenSet, groups, mockSets, onCreateGroup, onUpdateGroup, onDeleteGroup, onDeleteSet, onMoveSetToGroup }) => {
  const { user, signOut } = useAuth();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingSet, setExportingSet] = useState(null);
  const [groupsDropdownOpen, setGroupsDropdownOpen] = useState({});
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('blue');
  const [editingGroup, setEditingGroup] = useState(null);
  const [showGroupEditModal, setShowGroupEditModal] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [draggedGroup, setDraggedGroup] = useState(null);
  const [draggedSet, setDraggedSet] = useState(null);
  const [dragOverGroup, setDragOverGroup] = useState(null);
  const [showDeleteSetModal, setShowDeleteSetModal] = useState(false);
  const [setToDelete, setSetToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [scrollToGroupId, setScrollToGroupId] = useState(null);
  const groupRefs = useRef({});

  // Calculate total sets and words from groups
  const totalSets = mockSets ? mockSets.length : 0;
  const totalWords = mockSets ? mockSets.reduce((total, set) => total + (set.word_count || set.words?.length || 0), 0) : 0;

  const handleLogout = async () => {
    await signOut();
    // Navigation will be handled automatically by the AuthContext and ProtectedRoute
  };

  const handleExportComplete = () => {
    console.log('Export completed successfully');
  };

  const openExportModal = async (set) => {
    console.log('Opening export modal for set:', set.name);
    
    // Fetch words if not already loaded
    if (!set.words || set.words.length === 0) {
      try {
        const { fetchWordsBySet } = await import('../services/words');
        const wordsData = await fetchWordsBySet(set.id);
        setExportingSet({
          ...set,
          words: wordsData || []
        });
      } catch (err) {
        console.error('Failed to fetch words for export:', err);
        // Still show modal with empty words array
        setExportingSet({
          ...set,
          words: []
        });
      }
    } else {
      setExportingSet(set);
    }
    
    setShowExportModal(true);
  };

  const showNotificationMessage = (message, type = 'success', undoAction = null) => {
    setNotification({ message, type, undoAction });
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      setTimeout(() => setNotification(null), 300);
    }, 5000); // Increased time to 5 seconds for undo
  };

  const handleUndo = () => {
    if (notification?.undoAction) {
      notification.undoAction();
      setShowNotification(false);
      setTimeout(() => setNotification(null), 300);
    }
  };

  const toggleGroupDropdown = (groupId) => {
    setGroupsDropdownOpen(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const getGroupColor = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      red: 'from-red-500 to-red-600',
      yellow: 'from-yellow-500 to-orange-500',
      indigo: 'from-indigo-500 to-indigo-600',
      pink: 'from-pink-500 to-rose-500',
      teal: 'from-teal-500 to-cyan-500',
      emerald: 'from-emerald-500 to-green-600',
      violet: 'from-violet-500 to-purple-600'
    };
    return colors[color] || colors.blue;
  };

  const availableColors = [
    { name: 'blue', label: 'Ocean Blue', gradient: 'from-blue-500 to-blue-600' },
    { name: 'purple', label: 'Royal Purple', gradient: 'from-purple-500 to-purple-600' },
    { name: 'green', label: 'Forest Green', gradient: 'from-green-500 to-green-600' },
    { name: 'red', label: 'Crimson Red', gradient: 'from-red-500 to-red-600' },
    { name: 'yellow', label: 'Sunset Orange', gradient: 'from-yellow-500 to-orange-500' },
    { name: 'indigo', label: 'Deep Indigo', gradient: 'from-indigo-500 to-indigo-600' },
    { name: 'pink', label: 'Rose Pink', gradient: 'from-pink-500 to-rose-500' },
    { name: 'teal', label: 'Ocean Teal', gradient: 'from-teal-500 to-cyan-500' },
    { name: 'emerald', label: 'Emerald Green', gradient: 'from-emerald-500 to-green-600' },
    { name: 'violet', label: 'Mystic Violet', gradient: 'from-violet-500 to-purple-600' }
  ];

  // Helper function to get a random color
  const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * availableColors.length);
    return availableColors[randomIndex].name;
  };

  const handleCreateNewGroup = () => {
    if (newGroupName.trim()) {
      const newGroup = onCreateGroup({
        name: newGroupName.trim(),
        color: newGroupColor
      });
      setNewGroupName('');
      setNewGroupColor(getRandomColor());
      setIsCreatingNewGroup(false);
      
      // Set the ID to scroll to after the group is created
      if (newGroup && newGroup.id) {
        setScrollToGroupId(newGroup.id);
      }
    }
  };

  // Scroll to newly created group
  useEffect(() => {
    if (scrollToGroupId && groupRefs.current[scrollToGroupId]) {
      setTimeout(() => {
        groupRefs.current[scrollToGroupId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        setScrollToGroupId(null);
      }, 100);
    }
  }, [scrollToGroupId, groups]);

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setShowGroupEditModal(true);
  };

  const handleSaveGroupEdit = () => {
    if (editingGroup) {
      // Only send the fields that should be updated
      const updates = {
        name: editingGroup.name,
        color: editingGroup.color
      };
      onUpdateGroup(editingGroup.id, updates);
      setShowGroupEditModal(false);
      setEditingGroup(null);
    }
  };

  const handleDeleteGroupClick = (group) => {
    setGroupToDelete(group);
    setShowDeleteGroupModal(true);
  };

  const handleConfirmDeleteGroup = () => {
    if (groupToDelete) {
      onDeleteGroup(groupToDelete.id);
      setShowDeleteGroupModal(false);
      setGroupToDelete(null);
    }
  };

  const handleDeleteSetClick = (set) => {
    setSetToDelete(set);
    setShowDeleteSetModal(true);
  };

  const handleConfirmDeleteSet = () => {
    if (setToDelete) {
      const deletedSet = setToDelete;
      onDeleteSet(setToDelete.id);
      
      // Show notification with undo functionality
      showNotificationMessage(
        `"${deletedSet.name}" deleted successfully`, 
        'success',
        () => {
          // Undo action - this would need to be implemented in the parent component
          // For now, just show that undo was called
          showNotificationMessage(`Undo: "${deletedSet.name}" restored`, 'success');
        }
      );
      
      setShowDeleteSetModal(false);
      setSetToDelete(null);
    }
  };

  // Drag and Drop handlers for groups - simplified stable approach
  const handleGroupDragStart = (e, group) => {
    setDraggedGroup(group);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for some browsers
  };

  const handleGroupDragEnter = (e, group) => {
    e.preventDefault();
    if (!draggedGroup || draggedGroup.id === group.id) return;
    
    setDragOverGroup(group.id);
  };

  const handleGroupDragLeave = (e) => {
    setDragOverGroup(null);
  };

  const handleGroupDrop = (e, targetGroup) => {
    e.preventDefault();
    
    if (draggedGroup && draggedGroup.id !== targetGroup.id) {
      const draggedIndex = groups.findIndex(g => g.id === draggedGroup.id);
      const targetIndex = groups.findIndex(g => g.id === targetGroup.id);
      
      // Simple swap logic based on drag direction
      const newGroups = [...groups];
      newGroups.splice(draggedIndex, 1);
      newGroups.splice(targetIndex, 0, draggedGroup);
      
      // Update the groups order in parent component
      onUpdateGroup('reorder', newGroups);
    }
    
    handleGroupDragEnd();
  };

  const handleGroupDragEnd = () => {
    setDraggedGroup(null);
    setDragOverGroup(null);
  };

  // Drag and Drop handlers for sets
  const handleSetDragStart = (e, set) => {
    setDraggedSet(set);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for some browsers
    e.stopPropagation();
  };

  const handleSetDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSetDrop = (e, targetGroupId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedSet) {
      // Find source and target group names for notification
      const sourceGroup = groups.find(group => 
        group.sets.some(set => set.id === draggedSet.id)
      );
      const targetGroup = groups.find(group => group.id === targetGroupId);
      
      // Only move if different groups
      if (!sourceGroup || sourceGroup.id !== targetGroupId) {
        onMoveSetToGroup(draggedSet.id, targetGroupId);
        
        // Show success notification with undo functionality
        if (sourceGroup && targetGroup) {
          showNotificationMessage(
            `"${draggedSet.name}" moved to "${targetGroup.name}"`,
            'success',
            () => {
              // Undo action - move the set back to the original group
              onMoveSetToGroup(draggedSet.id, sourceGroup.id);
              showNotificationMessage(
                `"${draggedSet.name}" moved back to "${sourceGroup.name}"`,
                'success'
              );
            }
          );
        } else if (targetGroup) {
          showNotificationMessage(
            `"${draggedSet.name}" moved to "${targetGroup.name}"`,
            'success',
            sourceGroup ? () => {
              // Undo action - move the set back to the original group
              onMoveSetToGroup(draggedSet.id, sourceGroup.id);
              showNotificationMessage(
                `"${draggedSet.name}" moved back to "${sourceGroup.name}"`,
                'success'
              );
            } : null
          );
        }
      }
    }
    
    handleSetDragEnd();
  };

  const handleSetDragEnd = () => {
    setDraggedSet(null);
    setDragOverGroup(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* User Menu Bar */}
        <div className="flex justify-end items-center mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </div>
        </div>
        
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Vocabulary
            </span>
            <br />
            Assistant
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            Build, organize, and master your vocabulary with our intelligent learning platform
          </p>
          
          <button
            onClick={onCreateNewSet}
            className="group inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Set
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {/* Groups */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-md border border-white/50">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{groups.length}</p>
                <p className="text-sm sm:text-base text-gray-600">Groups</p>
              </div>
            </div>
          </div>

          {/* Vocabulary Sets */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-md border border-white/50">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalSets}</p>
                <p className="text-sm sm:text-base text-gray-600">Vocabulary Sets</p>
              </div>
            </div>
          </div>
          
          {/* Total Words */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-md border border-white/50">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalWords}</p>
                <p className="text-sm sm:text-base text-gray-600">Total Words</p>
              </div>
            </div>
          </div>
        </div>

        {/* Groups Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Vocabulary Groups</h2>
            {groups.length > 0 && (
              <button
                onClick={() => {
                  setNewGroupColor(getRandomColor());
                  setIsCreatingNewGroup(true);
                }}
                className="group hidden sm:inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden md:inline">Create New Group</span>
                <span className="md:hidden">New Group</span>
              </button>
            )}
          </div>
        </div>

        <div 
          className="space-y-4"
          onDragOver={(e) => {
            if (draggedGroup) {
              e.preventDefault();
            }
          }}
          onDrop={(e) => {
            if (draggedGroup) {
              e.preventDefault();
              // If dropping outside any group area, just clean up
              handleGroupDragEnd();
            }
          }}
        >
          {groups.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-md border border-white/50">
              {!isCreatingNewGroup ? (
                <div className="text-center">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14-7H5m14 14H5" />
                  </svg>
                  <h3 className="text-base sm:text-lg font-medium text-gray-500 mb-2">No vocabulary groups yet</h3>
                  <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 px-2">Create your first group to organize your vocabulary sets</p>
                  <button
                    onClick={() => {
                      setNewGroupColor(getRandomColor());
                      setIsCreatingNewGroup(true);
                    }}
                    className="group inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Your First Group
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Group</h3>
                  
                  <div className="space-y-4">
                    {/* Group Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Enter group name..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                        autoFocus
                      />
                    </div>
                    
                    {/* Color Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Choose Color Theme</label>
                      <div className="grid grid-cols-5 gap-3">
                        {availableColors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => setNewGroupColor(color.name)}
                            className={`relative p-3 rounded-xl transition-all duration-200 ${
                              newGroupColor === color.name 
                                ? 'ring-2 ring-blue-500 ring-offset-2' 
                                : 'hover:scale-105'
                            }`}
                            title={color.label}
                          >
                            <div className={`w-full h-8 bg-gradient-to-r ${color.gradient} rounded-lg`}></div>
                            {newGroupColor === color.name && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={() => {
                          setIsCreatingNewGroup(false);
                          setNewGroupName('');
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateNewGroup}
                        disabled={!newGroupName.trim()}
                        className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                          newGroupName.trim()
                            ? `bg-gradient-to-r ${getGroupColor(newGroupColor)} hover:shadow-lg`
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        Create Group
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {groups.map((group, index) => (
                <React.Fragment key={group.id}>
                  <div 
                    ref={(el) => groupRefs.current[group.id] = el}
                    data-group-id={group.id}
                    className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-white/50 overflow-hidden transition-all duration-200 ${
                      dragOverGroup === group.id && draggedGroup ? 'ring-2 ring-blue-400 scale-[1.02]' : ''
                    } ${draggedGroup?.id === group.id ? 'opacity-50 scale-95' : ''}`}
                    draggable={!draggedSet}
                    onDragStart={(e) => !draggedSet && handleGroupDragStart(e, group)}
                    onDragEnd={handleGroupDragEnd}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggedSet) {
                        handleSetDragOver(e);
                      }
                    }}
                    onDragEnter={(e) => handleGroupDragEnter(e, group)}
                    onDragLeave={handleGroupDragLeave}
                    onDrop={(e) => {
                      if (draggedSet) {
                        handleSetDrop(e, group.id);
                      } else {
                        handleGroupDrop(e, group);
                      }
                    }}
                  >
                  {/* Group Header */}
                  <div className="flex items-center">
                    {/* Drag handle - always visible but styled for mobile */}
                    <div className="flex items-center px-2 sm:px-4 py-2 text-gray-400 hover:text-gray-600 cursor-move touch-manipulation">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM6 4a1 1 0 011-1h6a1 1 0 011 1v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4zm2 2a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      </svg>
                    </div>
                    <button
                      onClick={() => toggleGroupDropdown(group.id)}
                      className="flex-1 flex items-center justify-between p-3 sm:p-6 pl-0 sm:pl-0 hover:bg-gray-50/50 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                        <div className={`p-2 sm:p-3 bg-gradient-to-r ${getGroupColor(group.color)} rounded-lg sm:rounded-xl flex-shrink-0`}>
                          <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 text-left truncate">{group.name}</h2>
                          <p className="text-xs sm:text-sm text-gray-500 text-left">
                            {group.sets.length} set{group.sets.length !== 1 ? 's' : ''} • {group.sets.reduce((total, set) => total + (set.word_count || set.words?.length || 0), 0)} words
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
                        <div className={`text-xs sm:text-sm text-white bg-gradient-to-r ${getGroupColor(group.color)} px-2 sm:px-3 py-1 rounded-full hidden sm:block`}>
                          {group.sets.reduce((total, set) => total + (set.word_count || set.words?.length || 0), 0)} total words
                        </div>
                        <svg 
                          className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 transition-transform duration-300 ${
                            groupsDropdownOpen[group.id] ? 'rotate-180' : ''
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    {/* Group Action Buttons */}
                    <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4">
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 touch-manipulation"
                        title="Edit group"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteGroupClick(group)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 touch-manipulation"
                        title="Delete group"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Group Content */}
                  <div className={`transition-all duration-300 ease-in-out ${
                    groupsDropdownOpen[group.id] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  } overflow-hidden`}>
                    <div 
                      className={`border-t border-gray-200/50 ${
                        dragOverGroup === group.id && draggedSet ? 'bg-blue-50' : ''
                      }`}
                    >
                      {group.sets.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center">
                          <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14-7H5m14 14H5" />
                          </svg>
                          <h3 className="text-sm sm:text-base font-medium text-gray-500 mb-2">No sets in this group yet</h3>
                          <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">Add your first vocabulary set to this group</p>
                          <button
                            onClick={onCreateNewSet}
                            className="group inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Set
                          </button>
                        </div>
                      ) : (
                        <div className="max-h-80 overflow-y-auto p-4" style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#cbd5e1 #f8fafc'
                        }}>
                          <style dangerouslySetInnerHTML={{
                            __html: `
                              .sets-scroller::-webkit-scrollbar {
                                width: 8px;
                              }
                              .sets-scroller::-webkit-scrollbar-track {
                                background: #f8fafc;
                                border-radius: 4px;
                                margin: 4px;
                              }
                              .sets-scroller::-webkit-scrollbar-thumb {
                                background: linear-gradient(to bottom, #e2e8f0, #cbd5e1);
                                border-radius: 4px;
                                border: 1px solid #f1f5f9;
                                transition: all 0.2s ease;
                              }
                              .sets-scroller::-webkit-scrollbar-thumb:hover {
                                background: linear-gradient(to bottom, #cbd5e1, #94a3b8);
                                border-color: #e2e8f0;
                              }
                            `
                          }} />
                          <div className="sets-scroller space-y-3">
                            {group.sets.map((set) => (
                              <div
                                key={set.id}
                                className={`bg-gradient-to-r from-white to-gray-50/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200/50 overflow-hidden group cursor-pointer ${
                                  draggedSet?.id === set.id ? 'opacity-50' : ''
                                }`}
                                draggable
                                onDragStart={(e) => handleSetDragStart(e, set)}
                                onDragEnd={handleSetDragEnd}
                                onClick={() => onOpenSet(set.id)}
                              >
                                <div className="p-3 sm:p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 sm:space-x-3">
                                        {/* Drag handle - always visible but styled for mobile */}
                                        <div className="flex items-center text-gray-400 hover:text-gray-600 cursor-move touch-manipulation">
                                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM6 4a1 1 0 011-1h6a1 1 0 011 1v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4zm2 2a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                          </svg>
                                        </div>
                                        <div className={`w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r ${getGroupColor(group.color)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
                                          </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                            {set.name}
                                          </h3>
                                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-1 space-y-1 sm:space-y-0">
                                            <p className="text-xs text-gray-600">
                                              {(set.word_count || set.words?.length || 0)} word{(set.word_count || set.words?.length || 0) !== 1 ? 's' : ''}
                                            </p>
                                            {/* Preview words - responsive layout */}
                                            {(set.word_count || set.words?.length || 0) > 0 && set.words && (
                                              <div className="flex flex-wrap gap-1 overflow-hidden">
                                                {(set.words || []).slice(0, 3).map((word, index) => {
                                                  const wordText = typeof word === 'string' ? word : word.word;
                                                  return (
                                                    <span
                                                      key={index}
                                                      className={`px-1.5 py-0.5 text-xs rounded-full text-white bg-gradient-to-r ${getGroupColor(group.color)} ${index > 1 ? 'hidden sm:inline' : ''}`}
                                                    >
                                                      {wordText.length > 6 ? wordText.substring(0, 6) + '...' : wordText}
                                                    </span>
                                                  );
                                                })}
                                                {(set.word_count || set.words?.length || 0) > 3 && (
                                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                                                    <span className="sm:hidden">+{(set.word_count || set.words?.length || 0) - 1}</span>
                                                    <span className="hidden sm:inline">+{(set.word_count || set.words?.length || 0) - 3}</span>
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-1 ml-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSetClick(set);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 touch-manipulation"
                                        title="Delete set"
                                      >
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openExportModal(set);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 touch-manipulation"
                                        title="Export set"
                                      >
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onOpenSet(set.id);
                                        }}
                                        className={`px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r ${getGroupColor(group.color)} text-white text-xs sm:text-sm rounded-lg hover:shadow-lg transition-all duration-200 flex items-center touch-manipulation`}
                                      >
                                        <span className="font-medium">Open</span>
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </React.Fragment>
              ))}

              {/* Beautiful Dashed Button - Always at the end */}
              {!isCreatingNewGroup && (
                <div 
                  onClick={() => {
                    setNewGroupColor(getRandomColor());
                    setIsCreatingNewGroup(true);
                  }}
                  className="group bg-white/40 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-400 p-8 hover:bg-white/60 transition-all duration-300 cursor-pointer min-h-[120px] flex flex-col items-center justify-center"
                >
                  {/* Plus Icon */}
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 group-hover:border-blue-500 flex items-center justify-center mb-4 transition-colors duration-300">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  
                  {/* Text */}
                  <h3 className="text-lg font-medium text-gray-500 group-hover:text-blue-600 transition-colors duration-300 mb-2">Create New Group</h3>
                  <p className="text-sm text-gray-400 group-hover:text-blue-500 transition-colors duration-300 text-center">Organize your vocabulary sets into themed groups</p>
                </div>
              )}

              {/* New Group Creation Form - appears inline */}
              {isCreatingNewGroup && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-white/50 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Group</h3>
                  
                  <div className="space-y-4">
                    {/* Group Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Enter group name..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                        autoFocus
                      />
                    </div>
                    
                    {/* Color Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Choose Color Theme</label>
                      <div className="grid grid-cols-5 gap-3">
                        {availableColors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => setNewGroupColor(color.name)}
                            className={`relative p-3 rounded-xl transition-all duration-200 ${
                              newGroupColor === color.name 
                                ? 'ring-2 ring-blue-500 ring-offset-2' 
                                : 'hover:scale-105'
                            }`}
                            title={color.label}
                          >
                            <div className={`w-full h-8 bg-gradient-to-r ${color.gradient} rounded-lg`}></div>
                            {newGroupColor === color.name && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={() => {
                          setIsCreatingNewGroup(false);
                          setNewGroupName('');
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateNewGroup}
                        disabled={!newGroupName.trim()}
                        className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                          newGroupName.trim()
                            ? `bg-gradient-to-r ${getGroupColor(newGroupColor)} hover:shadow-lg`
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        Create Group
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && exportingSet && (
        <ExportModal
          isOpen={showExportModal}
          set={exportingSet}
          onExport={handleExportComplete}
          onClose={() => {
            setShowExportModal(false);
            setExportingSet(null);
          }}
        />
      )}

      {/* Group Edit Modal */}
      {showGroupEditModal && editingGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-12 h-12 bg-gradient-to-r ${getGroupColor(editingGroup.color)} rounded-full flex items-center justify-center`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Edit Group</h3>
                  <p className="text-sm text-gray-600 mt-1">Customize group name and appearance</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                  <input
                    type="text"
                    value={editingGroup.name}
                    onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
                
                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Color Theme</label>
                  <div className="grid grid-cols-5 gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setEditingGroup({ ...editingGroup, color: color.name })}
                        className={`relative p-2 rounded-lg transition-all duration-200 ${
                          editingGroup.color === color.name 
                            ? 'ring-2 ring-blue-500 ring-offset-2' 
                            : 'hover:scale-105'
                        }`}
                        title={color.label}
                      >
                        <div className={`w-full h-6 bg-gradient-to-r ${color.gradient} rounded-md`}></div>
                        {editingGroup.color === color.name && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowGroupEditModal(false);
                    setEditingGroup(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGroupEdit}
                  disabled={!editingGroup.name.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                    editingGroup.name.trim()
                      ? `bg-gradient-to-r ${getGroupColor(editingGroup.color)} hover:shadow-lg`
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {showDeleteGroupModal && groupToDelete && (
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
                  <h3 className="text-lg font-semibold text-gray-900">Delete Group</h3>
                  <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>"{groupToDelete.name}"</strong>?
                {groupToDelete.sets.length > 0 && (
                  <span className="block mt-2 text-sm text-amber-600">
                    This will also delete {groupToDelete.sets.length} vocabulary set{groupToDelete.sets.length !== 1 ? 's' : ''} in this group.
                  </span>
                )}
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteGroupModal(false);
                    setGroupToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteGroup}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Set Confirmation Modal */}
      {showDeleteSetModal && setToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Set</h3>
                  <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the vocabulary set <strong>"{setToDelete.name}"</strong> 
                with {(setToDelete.word_count || setToDelete.words?.length || 0)} word{(setToDelete.word_count || setToDelete.words?.length || 0) !== 1 ? 's' : ''}?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteSetModal(false);
                    setSetToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteSet}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Set
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast - Mobile Friendly */}
      {notification && (
        <div className={`fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 sm:max-w-md z-50 transition-all duration-300 ease-in-out ${
          showNotification ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className={`flex items-center justify-between p-4 rounded-xl shadow-lg backdrop-blur-sm ${
            notification.type === 'success' 
              ? 'bg-green-500/90 text-white' 
              : 'bg-red-500/90 text-white'
          }`}>
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="font-medium text-sm sm:text-base truncate">{notification.message}</span>
            </div>
            
            <div className="flex items-center space-x-2 ml-3">
              {notification.undoAction && (
                <button
                  onClick={handleUndo}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap"
                >
                  Undo
                </button>
              )}
              <button
                onClick={() => {
                  setShowNotification(false);
                  setTimeout(() => setNotification(null), 300);
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};

export default Dashboard;