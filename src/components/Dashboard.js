import React from 'react';

const Dashboard = ({ onCreateNewSet }) => {
  // Mock data for existing sets
  const mockSets = [
    { id: 1, title: 'Spanish Verbs - Chapter 3', wordCount: 25 },
    { id: 2, title: 'French Vocabulary - Travel', wordCount: 18 },
    { id: 3, title: 'German Business Terms', wordCount: 32 }
  ];

  return (
    <div className="min-h-screen w-full relative">
      {/* Background decoration - now fills entire screen */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 -z-10"></div>
      <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-xl -z-10"></div>
      <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-pink-400/10 to-purple-400/10 rounded-full blur-xl -z-10"></div>
      
      {/* Content container */}
      <div className="w-full max-w-6xl mx-auto px-1 xs:px-3 sm:px-6 py-8 sm:py-12 flex flex-col min-h-screen">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 flex-shrink-0">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3 sm:mb-4">
            Vocabulary Assistant
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-0 xs:px-1">
            Transform your vocabulary learning with smart flashcards. 
            Create rich, engaging study materials in seconds.
          </p>
        </div>

        {/* Create New Set Button */}
                {/* Create New Set Button */}
        <div className="flex justify-center mb-8 sm:mb-12 flex-shrink-0">
          <button
            onClick={onCreateNewSet}
            className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-base sm:text-lg">Create New Set</span>
            </div>
          </button>
        </div>

        {/* My Sets Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-md border border-gray-200/50 p-4 sm:p-8 flex-1 mx-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 mr-2 sm:mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          My Sets
        </h2>
        
        {mockSets.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-lg font-medium">No word sets yet</p>
            <p className="text-sm mt-1">Create your first set to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {mockSets.map((set) => (
              <div
                key={set.id}
                className="group relative bg-gradient-to-r from-gray-50 to-blue-50/50 border border-gray-200/70 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-blue-300/70 hover:scale-[1.01]"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-blue-700 transition-colors">
                      {set.title}
                    </h3>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.998 1.998 0 013 12V7a2 2 0 012-2z" />
                      </svg>
                      <span className="text-sm font-medium">{set.wordCount} words</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 sm:space-x-3">
                    <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 rounded-lg sm:rounded-xl font-medium transition-all duration-200 hover:shadow-md">
                      Edit
                    </button>
                    <button className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base text-green-600 hover:text-white hover:bg-green-600 border border-green-600 rounded-lg sm:rounded-xl font-medium transition-all duration-200 hover:shadow-md">
                      Export
                    </button>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/5 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
      
      {/* Spacer to push content up if needed */}
      <div className="flex-grow"></div>
    </div>
  );
};

export default Dashboard;