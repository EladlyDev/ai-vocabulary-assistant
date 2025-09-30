import React, { useState, useEffect, useRef } from 'react';

const SetEditor = ({ set, onBack, onUpdateSet }) => {
  const [title, setTitle] = useState(set?.title || 'New Set');
  const [words, setWords] = useState(set?.words || '');
  const [sourceLanguage, setSourceLanguage] = useState('Auto-detect');
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  
  const sourceDropdownRef = useRef(null);
  const targetDropdownRef = useRef(null);

  const languages = ['Spanish', 'French', 'German', 'English', 'Auto-detect'];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target)) {
        setSourceDropdownOpen(false);
      }
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(event.target)) {
        setTargetDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onUpdateSet({ ...set, title: newTitle });
  };

  const handleWordsChange = (e) => {
    const newWords = e.target.value;
    setWords(newWords);
    onUpdateSet({ ...set, words: newWords });
  };

  // Mock enriched word data
  const mockEnrichedWord = {
    word: 'estudiar',
    sentence: 'Me gusta estudiar español por la mañana.',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=200&fit=crop',
    hasAudio: true
  };

  return (
    <div className="min-h-screen w-full relative">
      {/* Background decoration - now fills entire screen */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-blue-50/30 to-cyan-50/50 -z-10"></div>
      <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-2xl -z-10"></div>
      <div className="absolute bottom-20 left-20 w-32 h-32 bg-gradient-to-br from-cyan-400/10 to-purple-400/10 rounded-full blur-xl -z-10"></div>

      {/* Content container */}
      <div className="w-full max-w-6xl mx-auto px-1 xs:px-3 sm:px-6 py-6 sm:py-8 flex flex-col min-h-screen">

      {/* Header with Back Button */}
      <div className="relative flex items-center justify-center mb-6 sm:mb-8 flex-shrink-0">
        <button
          onClick={onBack}
          className="absolute left-0 group flex items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-xl transition-all duration-200 hover:shadow-sm"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:-translate-x-1 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs sm:text-sm font-medium">Back</span>
        </button>
        <div className="flex-1 max-w-md px-8 sm:px-16">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="w-full text-2xl sm:text-3xl font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-0 text-center placeholder-gray-400"
            placeholder="Enter set title..."
          />
        </div>
      </div>

      {/* Language Selection */}
      <div className="mb-6 sm:mb-8 flex-shrink-0 mx-1 xs:mx-3">`
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Source Language
            </label>
            <div className="relative" ref={sourceDropdownRef}>
              <button
                onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-left focus:border-blue-500 focus:ring-0 transition-all duration-200 hover:border-gray-300 text-gray-700 font-medium flex items-center justify-between text-sm sm:text-base"
              >
                <span>{sourceLanguage}</span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${sourceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {sourceDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-md z-10 py-1">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setSourceLanguage(lang);
                        setSourceDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors duration-150 text-gray-700 font-medium"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Target Language
            </label>
            <div className="relative" ref={targetDropdownRef}>
              <button
                onClick={() => setTargetDropdownOpen(!targetDropdownOpen)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-left focus:border-blue-500 focus:ring-0 transition-all duration-200 hover:border-gray-300 text-gray-700 font-medium flex items-center justify-between text-sm sm:text-base"
              >
                <span>{targetLanguage}</span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${targetDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {targetDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-md z-10 py-1">
                  {languages.filter(lang => lang !== 'Auto-detect').map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setTargetLanguage(lang);
                        setTargetDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors duration-150 text-gray-700 font-medium"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Word Input Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-md border border-gray-200/50 p-3 xs:p-4 sm:p-8 mb-6 sm:mb-8 flex-shrink-0 mx-1 xs:mx-3">
        <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-4 sm:mb-6">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Add Your Words
          </h2>
        </div>
        <div className="relative">
          <textarea
            value={words}
            onChange={handleWordsChange}
            placeholder="Paste your words here, one per line...

estudiar
caminar
escribir
leer"
            className="w-full h-40 sm:h-48 p-4 sm:p-6 border-2 border-gray-200 rounded-xl sm:rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 text-gray-700 placeholder-gray-400 text-sm sm:text-base"
          />
          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 text-xs text-gray-400 bg-white px-2 py-1 rounded-lg">
            {words.split('\n').filter(word => word.trim()).length} words
          </div>
        </div>
        <div className="mt-3 sm:mt-4">
          <button className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Process Words
          </button>
        </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-md border border-gray-200/50 p-3 xs:p-4 sm:p-8 flex-1 mx-1 xs:mx-3">
        <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6 sm:mb-8">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Preview: Enriched Word Card
          </h2>
        </div>
        
        <div className="max-w-md mx-auto sm:mx-0">
          <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-lg transition-all duration-300">
            {/* Image */}
            <div className="mb-6">
              <div className="relative group">
                <img
                  src={mockEnrichedWord.imageUrl}
                  alt={mockEnrichedWord.word}
                  className="w-full h-40 object-cover rounded-xl shadow-md"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-xl"></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors font-medium">
                  Next Image
                </button>
                <button className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors font-medium">
                  Upload Custom
                </button>
                <button className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors font-medium">
                  Remove
                </button>
              </div>
            </div>

            {/* Word */}
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-900 text-center">
                {mockEnrichedWord.word}
              </h3>
            </div>

            {/* Sentence */}
            <div className="mb-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-gray-700 italic text-center leading-relaxed">
                  "{mockEnrichedWord.sentence}"
                </p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium flex items-center mx-auto">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate sentence
              </button>
            </div>

            {/* Audio */}
            <div className="text-center">
              <button className="group bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white p-4 rounded-full shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                <svg className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </button>
              <p className="text-sm text-gray-600 mt-2 font-medium">Play pronunciation</p>
            </div>
          </div>
        </div>
        </div>
      </div>
      
      {/* Spacer to push content up if needed */}
      <div className="flex-grow"></div>
      </div>
    </div>
  );
};

export default SetEditor;