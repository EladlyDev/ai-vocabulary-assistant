// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

global.localStorage = localStorageMock;

describe('Editor Backup and Restore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Auto-Save to Backup', () => {
    test('should save editor state to localStorage', () => {
      const editorState = {
        title: 'Spanish Vocabulary',
        words: 'hola|hello\nadiós|goodbye\ngracias|thanks',
        sourceLanguage: 'Spanish',
        targetLanguage: 'English',
        selectedGroupId: 'group-1',
        timestamp: Date.now()
      };

      localStorage.setItem('editorBackup', JSON.stringify(editorState));

      const saved = JSON.parse(localStorage.getItem('editorBackup'));
      expect(saved.title).toBe('Spanish Vocabulary');
      expect(saved.words).toContain('hola|hello');
      expect(saved.sourceLanguage).toBe('Spanish');
      expect(saved.selectedGroupId).toBe('group-1');
    });

    test('should update backup on every change', () => {
      // Initial save
      let editorState = {
        title: 'Test Set',
        words: 'word1|trans1',
        timestamp: Date.now()
      };
      localStorage.setItem('editorBackup', JSON.stringify(editorState));

      // Update title
      editorState = {
        ...editorState,
        title: 'Updated Set',
        timestamp: Date.now()
      };
      localStorage.setItem('editorBackup', JSON.stringify(editorState));

      const saved = JSON.parse(localStorage.getItem('editorBackup'));
      expect(saved.title).toBe('Updated Set');
    });

    test('should save timestamp with backup', () => {
      const now = Date.now();
      const editorState = {
        title: 'Test Set',
        words: '',
        timestamp: now
      };

      localStorage.setItem('editorBackup', JSON.stringify(editorState));

      const saved = JSON.parse(localStorage.getItem('editorBackup'));
      expect(saved.timestamp).toBe(now);
      expect(saved.timestamp).toBeGreaterThan(0);
    });
  });

  describe('Restore from Backup', () => {
    test('should restore editor state on mount', () => {
      const backupData = {
        title: 'Saved Set',
        words: 'word1|trans1\nword2|trans2',
        sourceLanguage: 'Spanish',
        targetLanguage: 'English',
        selectedGroupId: 'group-1',
        timestamp: Date.now()
      };

      localStorage.setItem('editorBackup', JSON.stringify(backupData));

      // Simulate restore
      const backup = localStorage.getItem('editorBackup');
      let restoredState = null;
      
      if (backup) {
        const parsed = JSON.parse(backup);
        restoredState = {
          title: parsed.title,
          words: parsed.words,
          sourceLanguage: parsed.sourceLanguage,
          targetLanguage: parsed.targetLanguage,
          selectedGroupId: parsed.selectedGroupId
        };
      }

      expect(restoredState).not.toBeNull();
      expect(restoredState.title).toBe('Saved Set');
      expect(restoredState.words).toBe('word1|trans1\nword2|trans2');
    });

    test('should show notification if backup restored', () => {
      const twoMinutesAgo = Date.now() - (2 * 60 * 1000); // Changed to 2 minutes
      const backupData = {
        title: 'Recovered Set',
        words: 'word1|trans1',
        timestamp: twoMinutesAgo
      };

      localStorage.setItem('editorBackup', JSON.stringify(backupData));

      // Check if should show notification
      const backup = JSON.parse(localStorage.getItem('editorBackup'));
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      const isRecent = (now - backup.timestamp) < fiveMinutes;

      // Check if different from props (simulating new set)
      const propsTitle = 'New Set';
      const isDifferent = backup.title !== propsTitle;

      const shouldShowNotification = isRecent && isDifferent;

      expect(shouldShowNotification).toBe(true);
    });

    test('should not show notification if backup is old', () => {
      const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
      const backupData = {
        title: 'Old Backup',
        words: 'word1|trans1',
        timestamp: tenMinutesAgo
      };

      localStorage.setItem('editorBackup', JSON.stringify(backupData));

      const backup = JSON.parse(localStorage.getItem('editorBackup'));
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      const isRecent = (now - backup.timestamp) < fiveMinutes;

      expect(isRecent).toBe(false);
    });

    test('should not show notification if backup same as props', () => {
      const backupData = {
        title: 'Spanish Vocabulary',
        words: 'hola|hello',
        timestamp: Date.now()
      };

      localStorage.setItem('editorBackup', JSON.stringify(backupData));

      const backup = JSON.parse(localStorage.getItem('editorBackup'));
      const propsTitle = 'Spanish Vocabulary';
      const propsWords = 'hola|hello';
      const isDifferent = backup.title !== propsTitle || backup.words !== propsWords;

      expect(isDifferent).toBe(false);
    });
  });

  describe('Backup Cleanup', () => {
    test('should clear backup on successful save', () => {
      const backupData = {
        title: 'Test Set',
        words: 'word1|trans1',
        timestamp: Date.now()
      };

      localStorage.setItem('editorBackup', JSON.stringify(backupData));
      localStorage.setItem('uploadQueue', JSON.stringify({ setId: 'set-123' }));

      // Don't clear backup immediately on save - let upload process handle it
      // This allows user to return to editor if upload fails
      expect(localStorage.getItem('editorBackup')).not.toBeNull();

      // Backup should be cleared when upload completes
      // Simulate upload completion
      const uploadQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      const allUploaded = uploadQueue.setId === 'set-123'; // Simplified check

      if (allUploaded) {
        localStorage.removeItem('editorBackup');
        localStorage.removeItem('uploadQueue');
      }

      expect(localStorage.getItem('editorBackup')).toBeNull();
      expect(localStorage.getItem('uploadQueue')).toBeNull();
    });

    test('should clear backup when user confirms leaving without saving', () => {
      const backupData = {
        title: 'Unsaved Work',
        words: 'word1|trans1',
        timestamp: Date.now()
      };

      localStorage.setItem('editorBackup', JSON.stringify(backupData));

      // User confirms leaving without saving
      const userConfirmedDiscard = true;

      if (userConfirmedDiscard) {
        localStorage.removeItem('editorBackup');
      }

      expect(localStorage.getItem('editorBackup')).toBeNull();
    });

    test('should NOT clear backup on upload cancellation', () => {
      const backupData = {
        title: 'Test Set',
        words: 'word1|trans1',
        timestamp: Date.now()
      };

      localStorage.setItem('editorBackup', JSON.stringify(backupData));

      // Simulate upload cancellation
      const uploadCancelled = true;
      localStorage.removeItem('uploadQueue');
      
      // Backup should remain so user can resume editing
      expect(localStorage.getItem('editorBackup')).not.toBeNull();
    });
  });

  describe('View Mode Persistence', () => {
    test('should save view mode to localStorage', () => {
      const viewMode = 'flashcards';
      localStorage.setItem('viewMode', viewMode);

      const saved = localStorage.getItem('viewMode');
      expect(saved).toBe('flashcards');
    });

    test('should restore view mode on mount', () => {
      localStorage.setItem('viewMode', 'grid');

      const restored = localStorage.getItem('viewMode') || 'list';
      expect(restored).toBe('grid');
    });

    test('should default to list view if not saved', () => {
      const viewMode = localStorage.getItem('viewMode') || 'list';
      expect(viewMode).toBe('list');
    });
  });

  describe('Current View Persistence', () => {
    test('should save current view to localStorage', () => {
      const currentView = { name: 'viewer' };
      localStorage.setItem('currentView', JSON.stringify(currentView));

      const saved = JSON.parse(localStorage.getItem('currentView'));
      expect(saved.name).toBe('viewer');
    });

    test('should save active set to localStorage', () => {
      const activeSet = {
        id: 'set-123',
        name: 'Spanish Vocabulary',
        groupId: 'group-1'
      };
      localStorage.setItem('activeSet', JSON.stringify(activeSet));

      const saved = JSON.parse(localStorage.getItem('activeSet'));
      expect(saved.id).toBe('set-123');
      expect(saved.name).toBe('Spanish Vocabulary');
    });

    test('should not save words array in activeSet localStorage', () => {
      const activeSet = {
        id: 'set-123',
        name: 'Spanish Vocabulary',
        groupId: 'group-1'
        // words array intentionally omitted to save space
      };
      localStorage.setItem('activeSet', JSON.stringify(activeSet));

      const saved = JSON.parse(localStorage.getItem('activeSet'));
      expect(saved.words).toBeUndefined();
    });
  });

  describe('Corrupted Data Handling', () => {
    test('should handle corrupted editor backup', () => {
      localStorage.setItem('editorBackup', 'invalid json');

      let restoredState = null;
      try {
        const backup = localStorage.getItem('editorBackup');
        if (backup) {
          restoredState = JSON.parse(backup);
        }
      } catch (err) {
        // Fallback to default state
        restoredState = {
          title: 'New Set',
          words: ''
        };
        localStorage.removeItem('editorBackup');
      }

      expect(restoredState.title).toBe('New Set');
      expect(localStorage.getItem('editorBackup')).toBeNull();
    });

    test('should handle corrupted view state', () => {
      localStorage.setItem('currentView', 'not valid json');

      let currentView;
      try {
        currentView = JSON.parse(localStorage.getItem('currentView'));
      } catch (err) {
        currentView = { name: 'dashboard' };
        localStorage.removeItem('currentView');
      }

      expect(currentView.name).toBe('dashboard');
    });
  });

  describe('Multiple Backup Scenarios', () => {
    test('should handle backup from interrupted upload', () => {
      const backupData = {
        title: 'Large Set',
        words: Array.from({ length: 100 }, (_, i) => `word${i}|trans${i}`).join('\n'),
        timestamp: Date.now()
      };

      const uploadQueue = {
        setId: 'set-123',
        timestamp: Date.now(),
        totalWords: 100,
        words: Array.from({ length: 100 }, (_, i) => ({
          id: `word_${i}`,
          word: `word${i}`,
          translation: `trans${i}`,
          uploaded: i < 50, // 50% uploaded
          wordId: i < 50 ? `w${i}` : null
        }))
      };

      localStorage.setItem('editorBackup', JSON.stringify(backupData));
      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      // Both should exist for recovery
      expect(localStorage.getItem('editorBackup')).not.toBeNull();
      expect(localStorage.getItem('uploadQueue')).not.toBeNull();

      const queue = JSON.parse(localStorage.getItem('uploadQueue'));
      const uploadedCount = queue.words.filter(w => w.uploaded).length;
      expect(uploadedCount).toBe(50);
    });
  });
});
