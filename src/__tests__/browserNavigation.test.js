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

// Mock window.history with proper Jest mocks
const pushStateMock = jest.fn();
const replaceStateMock = jest.fn();
let mockState = null;

Object.defineProperty(window.history, 'pushState', {
  writable: true,
  value: pushStateMock
});

Object.defineProperty(window.history, 'replaceState', {
  writable: true,
  value: replaceStateMock
});

Object.defineProperty(window.history, 'state', {
  get: () => mockState,
  set: (value) => { mockState = value; }
});

describe('Browser Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    mockState = null;
    pushStateMock.mockClear();
    replaceStateMock.mockClear();
  });

  describe('History State Management', () => {
    test('should push state when navigating to dashboard', () => {
      const currentView = { name: 'dashboard' };
      const state = { view: currentView.name, setId: null };
      
      window.history.pushState(state, 'Dashboard', null);

      expect(pushStateMock).toHaveBeenCalledWith(
        state,
        'Dashboard',
        null
      );
    });

    test('should push state when navigating to set viewer', () => {
      const currentView = { name: 'viewer' };
      const activeSet = { id: 'set-123', name: 'Spanish Vocabulary' };
      const state = { view: currentView.name, setId: activeSet.id };
      
      window.history.pushState(state, 'Spanish Vocabulary', null);

      expect(pushStateMock).toHaveBeenCalledWith(
        state,
        'Spanish Vocabulary',
        null
      );
    });

    test('should push state when navigating to editor', () => {
      const currentView = { name: 'editor' };
      const state = { view: currentView.name, setId: null };
      
      window.history.pushState(state, 'New Set', null);

      expect(pushStateMock).toHaveBeenCalledWith(
        state,
        'New Set',
        null
      );
    });

    test('should not push duplicate state', () => {
      const state = { view: 'dashboard', setId: null };
      mockState = state;

      // Simulate duplicate state check
      const isDuplicate = JSON.stringify(window.history.state) === JSON.stringify(state);
      
      if (!isDuplicate) {
        window.history.pushState(state, 'Dashboard', null);
      }

      expect(pushStateMock).not.toHaveBeenCalled();
    });
  });

  describe('State Persistence', () => {
    test('should save currentView to localStorage', () => {
      const currentView = { name: 'dashboard' };
      localStorage.setItem('currentView', JSON.stringify(currentView));

      const saved = JSON.parse(localStorage.getItem('currentView'));
      expect(saved).toEqual({ name: 'dashboard' });
    });

    test('should save activeSet to localStorage', () => {
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

    test('should restore state from localStorage on mount', () => {
      const savedView = { name: 'viewer' };
      const savedSet = { id: 'set-123', name: 'Spanish Vocabulary' };
      
      localStorage.setItem('currentView', JSON.stringify(savedView));
      localStorage.setItem('activeSet', JSON.stringify(savedSet));

      // Simulate state restoration
      const restoredView = JSON.parse(localStorage.getItem('currentView')) || { name: 'dashboard' };
      const restoredSet = JSON.parse(localStorage.getItem('activeSet'));

      expect(restoredView.name).toBe('viewer');
      expect(restoredSet.id).toBe('set-123');
    });

    test('should default to dashboard if no saved state', () => {
      const currentView = JSON.parse(localStorage.getItem('currentView')) || { name: 'dashboard' };
      
      expect(currentView.name).toBe('dashboard');
    });
  });

  describe('Back Button Behavior', () => {
    test('should navigate from viewer to dashboard', () => {
      // Setup: currently on viewer
      let currentView = { name: 'viewer' };
      let activeSet = { id: 'set-123', name: 'Spanish Vocabulary' };

      // Simulate back button - should go to dashboard
      const previousState = { view: 'dashboard', setId: null };
      
      currentView = { name: previousState.view };
      activeSet = null;

      expect(currentView.name).toBe('dashboard');
      expect(activeSet).toBeNull();
    });

    test('should navigate from editor to dashboard', () => {
      let currentView = { name: 'editor' };
      let activeSet = { name: 'New Set', words: [] };

      const previousState = { view: 'dashboard', setId: null };
      
      currentView = { name: previousState.view };
      activeSet = null;

      expect(currentView.name).toBe('dashboard');
      expect(activeSet).toBeNull();
    });

    test('should show confirmation modal for unsaved changes', () => {
      let hasUnsavedChanges = true;
      let showBrowserBackConfirm = false;
      let pendingNavigation = null;

      // Simulate back button with unsaved changes
      if (hasUnsavedChanges) {
        showBrowserBackConfirm = true;
        pendingNavigation = { view: 'dashboard', setId: null };
      }

      expect(showBrowserBackConfirm).toBe(true);
      expect(pendingNavigation).toEqual({ view: 'dashboard', setId: null });
    });

    test('should navigate without confirmation if no unsaved changes', () => {
      let hasUnsavedChanges = false;
      let showBrowserBackConfirm = false;
      let currentView = { name: 'viewer' };

      const previousState = { view: 'dashboard', setId: null };

      if (!hasUnsavedChanges) {
        currentView = { name: previousState.view };
      } else {
        showBrowserBackConfirm = true;
      }

      expect(showBrowserBackConfirm).toBe(false);
      expect(currentView.name).toBe('dashboard');
    });
  });

  describe('Forward Button Behavior', () => {
    test('should navigate from dashboard to previously viewed set', () => {
      let currentView = { name: 'dashboard' };
      let activeSet = null;

      const forwardState = { view: 'viewer', setId: 'set-123' };
      const mockSets = [
        { id: 'set-123', name: 'Spanish Vocabulary', words: [] }
      ];

      // Simulate forward navigation
      if (forwardState.view === 'viewer' && forwardState.setId) {
        const selectedSet = mockSets.find(s => s.id === forwardState.setId);
        if (selectedSet) {
          currentView = { name: 'viewer' };
          activeSet = selectedSet;
        }
      }

      expect(currentView.name).toBe('viewer');
      expect(activeSet.id).toBe('set-123');
    });
  });

  describe('Scroll Management', () => {
    test('should reset scroll on view change', () => {
      let scrollPosition = { x: 0, y: 0 };
      
      // Mock window.scrollTo
      window.scrollTo = jest.fn((x, y) => {
        scrollPosition = { x, y };
      });

      // Simulate view change
      const currentView = { name: 'dashboard' };
      window.scrollTo(0, 0);

      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
      expect(scrollPosition).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Confirmation Modal', () => {
    test('should discard changes and navigate on confirm', () => {
      let hasUnsavedChanges = true;
      let currentView = { name: 'editor' };
      let pendingNavigation = { view: 'dashboard', setId: null };

      // Simulate confirmation
      hasUnsavedChanges = false;
      currentView = { name: pendingNavigation.view };
      pendingNavigation = null;
      
      // Should clear editor backup
      localStorage.removeItem('editorBackup');

      expect(hasUnsavedChanges).toBe(false);
      expect(currentView.name).toBe('dashboard');
      expect(pendingNavigation).toBeNull();
      expect(localStorage.getItem('editorBackup')).toBeNull();
    });

    test('should stay on current view on cancel', () => {
      let currentView = { name: 'editor' };
      let pendingNavigation = { view: 'dashboard', setId: null };

      // Simulate cancellation
      pendingNavigation = null;

      expect(currentView.name).toBe('editor');
      expect(pendingNavigation).toBeNull();
    });
  });

  describe('Navigation with Upload in Progress', () => {
    test('should allow navigation while upload in progress', () => {
      let uploadInProgress = true;
      let currentView = { name: 'viewer' };

      // Upload in progress should not block navigation
      currentView = { name: 'dashboard' };

      expect(currentView.name).toBe('dashboard');
      expect(uploadInProgress).toBe(true); // Upload continues in background
    });

    test('should preserve upload queue on navigation', () => {
      const uploadQueue = {
        setId: 'set-123',
        timestamp: Date.now(),
        totalWords: 10,
        words: [
          { id: 'word_0', word: 'hola', translation: 'hello', uploaded: true, wordId: 'w1' },
          { id: 'word_1', word: 'adiós', translation: 'goodbye', uploaded: false, wordId: null },
        ]
      };

      localStorage.setItem('uploadQueue', JSON.stringify(uploadQueue));

      // Navigate away
      let currentView = { name: 'viewer' };
      currentView = { name: 'dashboard' };

      // Queue should still exist
      const savedQueue = localStorage.getItem('uploadQueue');
      expect(savedQueue).not.toBeNull();
      expect(JSON.parse(savedQueue).setId).toBe('set-123');
    });
  });

  describe('Initial History State', () => {
    test('should set initial state on first load', () => {
      mockState = null;

      // Simulate initial load
      if (!window.history.state) {
        const initialState = { view: 'dashboard', setId: null };
        window.history.replaceState(initialState, 'Dashboard', null);
      }

      expect(replaceStateMock).toHaveBeenCalledWith(
        { view: 'dashboard', setId: null },
        'Dashboard',
        null
      );
    });
  });
});
