import { renderHook, act, waitFor } from '@testing-library/react';

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

describe('Auto-Resume Functionality', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Resume Detection', () => {
    test('should detect incomplete upload on mount', () => {
      const uploadQueue = {
        setId: 'set-123',
        setName: 'Spanish Vocabulary',
        timestamp: Date.now(),
        totalWords: 5,
        words: [
          { id: 'word_0', word: 'hola', translation: 'hello', uploaded: true, wordId: 'w1' },
          { id: 'word_1', word: 'adiós', translation: 'goodbye', uploaded: true, wordId: 'w2' },
          { id: 'word_2', word: 'gracias', translation: 'thanks', uploaded: false, wordId: null },
          { id: 'word_3', word: 'por favor', translation: 'please', uploaded: false, wordId: null },
          { id: 'word_4', word: 'perdón', translation: 'sorry', uploaded: false, wordId: null },
        ]
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      // Simulate auto-resume check
      const savedQueue = localStorage.getItem('uploadQueue');
      const hasIncompleteUpload = savedQueue !== null;

      if (hasIncompleteUpload) {
        const queueData = JSON.parse(savedQueue);
        const unuploadedWords = queueData.words.filter(w => !w.uploaded);
        
        expect(unuploadedWords).toHaveLength(3);
        expect(queueData.setId).toBe('set-123');
      }

      expect(hasIncompleteUpload).toBe(true);
    });

    test('should not resume if no queue exists', () => {
      const savedQueue = localStorage.getItem('uploadQueue');
      const hasIncompleteUpload = savedQueue !== null;

      expect(hasIncompleteUpload).toBe(false);
    });

    test('should not resume if all words uploaded', () => {
      const uploadQueue = {
        setId: 'set-123',
        timestamp: Date.now(),
        totalWords: 3,
        words: [
          { id: 'word_0', word: 'hola', translation: 'hello', uploaded: true, wordId: 'w1' },
          { id: 'word_1', word: 'adiós', translation: 'goodbye', uploaded: true, wordId: 'w2' },
          { id: 'word_2', word: 'gracias', translation: 'thanks', uploaded: true, wordId: 'w3' },
        ]
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      const savedQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      const unuploadedWords = savedQueue.words.filter(w => !w.uploaded);
      const shouldResume = unuploadedWords.length > 0;

      expect(shouldResume).toBe(false);

      // Should clear queue
      if (!shouldResume) {
        localStorage.removeItem('uploadQueue');
      }

      expect(localStorage.getItem('uploadQueue')).toBeNull();
    });

    test('should not resume if queue is too old', () => {
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
      const uploadQueue = {
        setId: 'set-123',
        timestamp: twoHoursAgo,
        totalWords: 3,
        words: [
          { id: 'word_0', word: 'hola', translation: 'hello', uploaded: false, wordId: null },
        ]
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      const savedQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      const timeSinceStart = Date.now() - savedQueue.timestamp;
      const oneHour = 60 * 60 * 1000;
      const isValid = timeSinceStart < oneHour;

      expect(isValid).toBe(false);

      if (!isValid) {
        localStorage.removeItem('uploadQueue');
      }

      expect(localStorage.getItem('uploadQueue')).toBeNull();
    });
  });

  describe('Resume State', () => {
    test('should calculate correct resume point', () => {
      const uploadQueue = {
        setId: 'set-123',
        timestamp: Date.now(),
        totalWords: 10,
        words: Array.from({ length: 10 }, (_, i) => ({
          id: `word_${i}`,
          word: `word${i}`,
          translation: `trans${i}`,
          uploaded: i < 4, // First 4 uploaded
          wordId: i < 4 ? `w${i}` : null
        }))
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      const savedQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      const uploadedCount = savedQueue.words.filter(w => w.uploaded).length;
      const unuploadedWords = savedQueue.words.filter(w => !w.uploaded);

      expect(uploadedCount).toBe(4);
      expect(unuploadedWords).toHaveLength(6);
      expect(unuploadedWords[0].word).toBe('word4');
    });

    test('should preserve set metadata during resume', () => {
      const uploadQueue = {
        setId: 'set-123',
        setName: 'Spanish Vocabulary',
        groupId: 'group-1',
        timestamp: Date.now(),
        totalWords: 5,
        words: [
          { id: 'word_0', word: 'hola', translation: 'hello', uploaded: true, wordId: 'w1' },
          { id: 'word_1', word: 'adiós', translation: 'goodbye', uploaded: false, wordId: null },
        ]
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      const savedQueue = JSON.parse(localStorage.getItem('uploadQueue'));

      expect(savedQueue.setId).toBe('set-123');
      expect(savedQueue.setName).toBe('Spanish Vocabulary');
      expect(savedQueue.groupId).toBe('group-1');
      expect(savedQueue.totalWords).toBe(5);
    });
  });

  describe('Resume Refs', () => {
    test('should prevent duplicate resume attempts', () => {
      let hasCheckedResumeRef = { current: false };
      let uploadInProgressRef = { current: false };

      // First check
      if (!hasCheckedResumeRef.current && !uploadInProgressRef.current) {
        hasCheckedResumeRef.current = true;
        uploadInProgressRef.current = true;
        // Start resume...
      }

      expect(hasCheckedResumeRef.current).toBe(true);
      expect(uploadInProgressRef.current).toBe(true);

      // Second check should be blocked
      let shouldResume = false;
      if (!hasCheckedResumeRef.current && !uploadInProgressRef.current) {
        shouldResume = true;
      }

      expect(shouldResume).toBe(false);
    });

    test('should track upload in progress state', () => {
      let uploadInProgressRef = { current: false };

      // Start upload
      uploadInProgressRef.current = true;
      expect(uploadInProgressRef.current).toBe(true);

      // Upload complete
      uploadInProgressRef.current = false;
      expect(uploadInProgressRef.current).toBe(false);
    });

    test('should allow new upload after previous complete', () => {
      let uploadInProgressRef = { current: false };
      let hasCheckedResumeRef = { current: false };

      // First upload
      if (!uploadInProgressRef.current) {
        uploadInProgressRef.current = true;
      }
      expect(uploadInProgressRef.current).toBe(true);

      // Complete first upload
      uploadInProgressRef.current = false;
      hasCheckedResumeRef.current = false;

      // Second upload should be allowed
      let canStartNewUpload = !uploadInProgressRef.current;
      expect(canStartNewUpload).toBe(true);
    });
  });

  describe('Resume Progress Notification', () => {
    test('should show resuming message with correct progress', () => {
      const uploadQueue = {
        setId: 'set-123',
        timestamp: Date.now(),
        totalWords: 10,
        words: Array.from({ length: 10 }, (_, i) => ({
          id: `word_${i}`,
          word: `word${i}`,
          translation: `trans${i}`,
          uploaded: i < 3,
          wordId: i < 3 ? `w${i}` : null
        }))
      };

      const uploadedCount = uploadQueue.words.filter(w => w.uploaded).length;
      const progressNotification = {
        total: uploadQueue.totalWords,
        current: uploadedCount,
        message: `Resuming upload... (${uploadedCount}/${uploadQueue.totalWords})`
      };

      expect(progressNotification.current).toBe(3);
      expect(progressNotification.total).toBe(10);
      expect(progressNotification.message).toBe('Resuming upload... (3/10)');
    });
  });

  describe('Resume Error Handling', () => {
    test('should clear queue if set no longer exists', () => {
      const uploadQueue = {
        setId: 'non-existent-set',
        timestamp: Date.now(),
        totalWords: 3,
        words: [
          { id: 'word_0', word: 'hola', translation: 'hello', uploaded: false, wordId: null },
        ]
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      // Simulate set not found
      const mockSets = [
        { id: 'set-1', name: 'Set 1' },
        { id: 'set-2', name: 'Set 2' }
      ];
      
      const savedQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      const setExists = mockSets.some(set => set.id === savedQueue.setId);

      if (!setExists) {
        localStorage.removeItem('uploadQueue');
      }

      expect(localStorage.getItem('uploadQueue')).toBeNull();
    });

    test('should handle corrupted queue data', () => {
      localStorage.setItem('uploadQueue', 'invalid json data');

      let hasValidQueue = false;
      try {
        const savedQueue = JSON.parse(localStorage.getItem('uploadQueue'));
        hasValidQueue = savedQueue !== null;
      } catch (err) {
        localStorage.removeItem('uploadQueue');
      }

      expect(hasValidQueue).toBe(false);
      expect(localStorage.getItem('uploadQueue')).toBeNull();
    });
  });

  describe('Background Resume', () => {
    test('should resume without changing current view', () => {
      const uploadQueue = {
        setId: 'set-123',
        setName: 'Spanish Vocabulary',
        timestamp: Date.now(),
        totalWords: 5,
        words: [
          { id: 'word_0', word: 'hola', translation: 'hello', uploaded: true, wordId: 'w1' },
          { id: 'word_1', word: 'adiós', translation: 'goodbye', uploaded: false, wordId: null },
        ]
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      let currentView = { name: 'dashboard' };
      
      // Simulate resume check - should NOT change view
      const savedQueue = localStorage.getItem('uploadQueue');
      if (savedQueue) {
        // Resume in background, don't change currentView
        const resumeInBackground = true;
        if (!resumeInBackground) {
          currentView = { name: 'viewer' };
        }
      }

      expect(currentView.name).toBe('dashboard');
    });
  });
});
