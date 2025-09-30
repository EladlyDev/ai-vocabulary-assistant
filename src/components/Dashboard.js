import React, { useState } from 'react';
import ExportModal from './ExportModal';

const Dashboard = ({ onCreateNewSet, onOpenSet, sets }) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingSet, setExportingSet] = useState(null);

  const handleExportComplete = () => {
    console.log('Export completed successfully');
  };

  const openExportModal = (set) => {
    console.log('Opening export modal for set:', set.name);
    setExportingSet(set);
    setShowExportModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Vocabulary
            </span>
            <br />
            Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Build, organize, and master your vocabulary with our intelligent learning platform
          </p>
          
          <button
            onClick={onCreateNewSet}
            className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-6 h-6 mr-3 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Set
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-white/50">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{sets.length}</p>
                <p className="text-gray-600">Vocabulary Sets</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-white/50">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {sets.reduce((total, set) => total + set.words.length, 0)}
                </p>
                <p className="text-gray-600">Total Words</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-white/50">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(sets.reduce((total, set) => total + set.words.length, 0) / Math.max(sets.length, 1))}
                </p>
                <p className="text-gray-600">Avg Words/Set</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sets Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Vocabulary Sets</h2>
            <div className="text-sm text-gray-500">
              {sets.length} set{sets.length !== 1 ? 's' : ''}
            </div>
          </div>

          {sets.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14-7H5m14 14H5" />
              </svg>
              <h3 className="text-xl font-medium text-gray-500 mb-2">No vocabulary sets yet</h3>
              <p className="text-gray-400 mb-6">Create your first set to start building your vocabulary</p>
              <button
                onClick={onCreateNewSet}
                className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Set
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sets.map((set) => (
                <div
                  key={set.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 border border-white/50 overflow-hidden group flex flex-col h-full cursor-pointer"
                  onClick={() => onOpenSet(set.id)}
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {set.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {set.words.length} word{set.words.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openExportModal(set);
                          }}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                          title="Export set"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Preview of first few words */}
                    {set.words.length > 0 && (
                      <div className="mb-4 flex-1">
                        <div className="flex flex-wrap gap-2">
                          {set.words.slice(0, 3).map((word, index) => {
                            const wordText = typeof word === 'string' ? word : word.word;
                            return (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                              >
                                {wordText}
                              </span>
                            );
                          })}
                          {set.words.length > 3 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm rounded-full">
                              +{set.words.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSet(set.id);
                      }}
                      className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] mt-auto"
                    >
                      <span className="font-medium">Open Set</span>
                      <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  );
};

export default Dashboard;