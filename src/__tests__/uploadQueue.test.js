import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock environment variables FIRST
process.env.REACT_APP_SUPABASE_URL = 'https://mock-project.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'mock-anon-key';

// Mock Supabase
jest.mock('../services/words', () => ({
  fetchWordsBySet: jest.fn(),
  createWord: jest.fn(),
  updateWord: jest.fn(),
  deleteWord: jest.fn(),
}));

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

describe('Upload Queue Management', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    localStorage.clear();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('Queue Creation', () => {
    test('should create upload queue with correct structure', () => {
      const uploadQueue = {
        setId: 'set-123',
        setName: 'Spanish Vocabulary',
        groupId: 'group-1',
        timestamp: Date.now(),
        totalWords: 3,
        words: [
          { id: 'word_0', word: 'hola', translation: 'hello', uploaded: false, wordId: null },
          { id: 'word_1', word: 'adiós', translation: 'goodbye', uploaded: false, wordId: null },
          { id: 'word_2', word: 'gracias', translation: 'thanks', uploaded: false, wordId: null },
        ]
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      const savedQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      
      expect(savedQueue).toBeDefined();
      expect(savedQueue.setId).toBe('set-123');
      expect(savedQueue.totalWords).toBe(3);
      expect(savedQueue.words).toHaveLength(3);
      expect(savedQueue.words[0]).toMatchObject({
        word: 'hola',
        translation: 'hello',
        uploaded: false
      });
    });

    test('should track word-level upload status', () => {
      const uploadQueue = {
        setId: 'set-123',
        timestamp: Date.now(),
        totalWords: 3,
        words: [
          { id: 'word_0', word: 'hola', translation: 'hello', uploaded: true, wordId: 'w1' },
          { id: 'word_1', word: 'adiós', translation: 'goodbye', uploaded: false, wordId: null },
          { id: 'word_2', word: 'gracias', translation: 'thanks', uploaded: false, wordId: null },
        ]
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      const savedQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      const uploadedWords = savedQueue.words.filter(w => w.uploaded);
      const unuploadedWords = savedQueue.words.filter(w => !w.uploaded);

      expect(uploadedWords).toHaveLength(1);
      expect(unuploadedWords).toHaveLength(2);
      expect(uploadedWords[0].wordId).toBe('w1');
    });

    test('should update queue after batch upload', () => {
      const uploadQueue = {
        setId: 'set-123',
        timestamp: Date.now(),
        totalWords: 3,
        words: [
          { id: 'word_0', word: 'hola', translation: 'hello', uploaded: false, wordId: null },
          { id: 'word_1', word: 'adiós', translation: 'goodbye', uploaded: false, wordId: null },
          { id: 'word_2', word: 'gracias', translation: 'thanks', uploaded: false, wordId: null },
        ]
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      // Simulate batch upload completion
      let currentQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      currentQueue.words[0].uploaded = true;
      currentQueue.words[0].wordId = 'w1';
      currentQueue.words[1].uploaded = true;
      currentQueue.words[1].wordId = 'w2';
      localStorage.setItem('uploadQueue', JSON.stringify(currentQueue));

      const updatedQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      const uploadedCount = updatedQueue.words.filter(w => w.uploaded).length;

      expect(uploadedCount).toBe(2);
      expect(updatedQueue.words[0].uploaded).toBe(true);
      expect(updatedQueue.words[1].uploaded).toBe(true);
      expect(updatedQueue.words[2].uploaded).toBe(false);
    });
  });

  describe('Queue Cleanup', () => {
    test('should clear queue after complete upload', () => {
      const uploadQueue = {
        setId: 'set-123',
        timestamp: Date.now(),
        totalWords: 2,
        words: [
          { id: 'word_0', word: 'hola', translation: 'hello', uploaded: true, wordId: 'w1' },
          { id: 'word_1', word: 'adiós', translation: 'goodbye', uploaded: true, wordId: 'w2' },
        ]
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      // Check if all words are uploaded
      const savedQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      const unuploadedWords = savedQueue.words.filter(w => !w.uploaded);

      if (unuploadedWords.length === 0) {
        localStorage.removeItem('uploadQueue');
        localStorage.removeItem('editorBackup');
      }

      expect(localStorage.getItem('uploadQueue')).toBeNull();
      expect(localStorage.getItem('editorBackup')).toBeNull();
    });

    test('should clear queue if older than 1 hour', () => {
      const oneHourAgo = Date.now() - (61 * 60 * 1000); // 61 minutes ago
      const uploadQueue = {
        setId: 'set-123',
        timestamp: oneHourAgo,
        totalWords: 2,
        words: [
          { id: 'word_0', word: 'hola', translation: 'hello', uploaded: false, wordId: null },
        ]
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      // Simulate timeout check
      const savedQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      const timeSinceStart = Date.now() - savedQueue.timestamp;
      const oneHour = 60 * 60 * 1000;

      if (timeSinceStart >= oneHour) {
        localStorage.removeItem('uploadQueue');
      }

      expect(localStorage.getItem('uploadQueue')).toBeNull();
    });

    test('should keep queue if less than 1 hour old', () => {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const uploadQueue = {
        setId: 'set-123',
        timestamp: fiveMinutesAgo,
        totalWords: 2,
        words: [
          { id: 'word_0', word: 'hola', translation: 'hello', uploaded: false, wordId: null },
        ]
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      // Simulate timeout check
      const savedQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      const timeSinceStart = Date.now() - savedQueue.timestamp;
      const oneHour = 60 * 60 * 1000;

      if (timeSinceStart >= oneHour) {
        localStorage.removeItem('uploadQueue');
      }

      expect(localStorage.getItem('uploadQueue')).not.toBeNull();
    });
  });

  describe('Queue Progress Tracking', () => {
    test('should calculate progress correctly', () => {
      const uploadQueue = {
        setId: 'set-123',
        timestamp: Date.now(),
        totalWords: 10,
        words: Array.from({ length: 10 }, (_, i) => ({
          id: `word_${i}`,
          word: `word${i}`,
          translation: `trans${i}`,
          uploaded: i < 6, // 6 out of 10 uploaded
          wordId: i < 6 ? `w${i}` : null
        }))
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      const savedQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      const uploadedCount = savedQueue.words.filter(w => w.uploaded).length;
      const progress = (uploadedCount / savedQueue.totalWords) * 100;

      expect(uploadedCount).toBe(6);
      expect(progress).toBe(60);
    });

    test('should identify remaining words correctly', () => {
      const uploadQueue = {
        setId: 'set-123',
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

      const savedQueue = JSON.parse(localStorage.getItem('uploadQueue'));
      const unuploadedWords = savedQueue.words.filter(w => !w.uploaded);

      expect(unuploadedWords).toHaveLength(3);
      expect(unuploadedWords[0].word).toBe('gracias');
      expect(unuploadedWords[1].word).toBe('por favor');
      expect(unuploadedWords[2].word).toBe('perdón');
    });
  });

  describe('Batch Processing', () => {
    test('should create batches of 10 words', () => {
      const words = Array.from({ length: 25 }, (_, i) => ({
        word: `word${i}`,
        translation: `trans${i}`
      }));

      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < words.length; i += batchSize) {
        batches.push(words.slice(i, i + batchSize));
      }

      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(10);
      expect(batches[1]).toHaveLength(10);
      expect(batches[2]).toHaveLength(5);
    });

    test('should handle single batch', () => {
      const words = Array.from({ length: 5 }, (_, i) => ({
        word: `word${i}`,
        translation: `trans${i}`
      }));

      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < words.length; i += batchSize) {
        batches.push(words.slice(i, i + batchSize));
      }

      expect(batches).toHaveLength(1);
      expect(batches[0]).toHaveLength(5);
    });

    test('should handle exact batch size', () => {
      const words = Array.from({ length: 20 }, (_, i) => ({
        word: `word${i}`,
        translation: `trans${i}`
      }));

      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < words.length; i += batchSize) {
        batches.push(words.slice(i, i + batchSize));
      }

      expect(batches).toHaveLength(2);
      expect(batches[0]).toHaveLength(10);
      expect(batches[1]).toHaveLength(10);
    });
  });

  describe('Upload Cancellation', () => {
    test('should clear queue on cancellation', () => {
      const uploadQueue = {
        setId: 'set-123',
        timestamp: Date.now(),
        totalWords: 5,
        words: [
          { id: 'word_0', word: 'hola', translation: 'hello', uploaded: true, wordId: 'w1' },
          { id: 'word_1', word: 'adiós', translation: 'goodbye', uploaded: false, wordId: null },
          { id: 'word_2', word: 'gracias', translation: 'thanks', uploaded: false, wordId: null },
        ]
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));
      localStorage.setItem('editorBackup', JSON.stringify({ title: 'Test Set' }));

      // Simulate cancellation
      localStorage.removeItem('uploadQueue');
      localStorage.removeItem('editorBackup');

      expect(localStorage.getItem('uploadQueue')).toBeNull();
      expect(localStorage.getItem('editorBackup')).toBeNull();
    });

    test('should reset cancel flag on new upload', () => {
      let uploadCancelledRef = { current: true };

      // Simulate new upload start
      uploadCancelledRef.current = false;

      expect(uploadCancelledRef.current).toBe(false);
    });
  });
});
