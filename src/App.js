import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import SetEditor from './components/SetEditor';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentSet, setCurrentSet] = useState(null);

  const handleCreateNewSet = () => {
    setCurrentSet({ title: 'New Set', words: '' });
    setCurrentView('setEditor');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentSet(null);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {currentView === 'dashboard' && (
        <Dashboard onCreateNewSet={handleCreateNewSet} />
      )}
      {currentView === 'setEditor' && (
        <SetEditor 
          set={currentSet} 
          onBack={handleBackToDashboard}
          onUpdateSet={setCurrentSet}
        />
      )}
    </div>
  );
}

export default App;
