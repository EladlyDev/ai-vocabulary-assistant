import React, { useState, useRef, useEffect } from 'react';

const ExportModal = ({ isOpen, onClose, set, onExport }) => {
  const [includeTranslations, setIncludeTranslations] = useState(true);
  const [includePronunciation, setIncludePronunciation] = useState(true);
  const [includeTimestamps, setIncludeTimestamps] = useState(false);
  const [includeImages, setIncludeImages] = useState(true);
  const [exportType, setExportType] = useState('file');
  const [fileFormat, setFileFormat] = useState('json');
  const [platform, setPlatform] = useState('anki');
  
  const [fileFormatDropdownOpen, setFileFormatDropdownOpen] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  
  const fileFormatDropdownRef = useRef(null);
  const platformDropdownRef = useRef(null);

  const fileFormats = [
    { value: 'json', label: 'JSON (.json)', description: 'Structured data format' },
    { value: 'csv', label: 'CSV (.csv)', description: 'Spreadsheet compatible' },
    { value: 'txt', label: 'Text (.txt)', description: 'Plain text format' }
  ];

  const platforms = [
    { value: 'anki', label: 'Anki', description: 'Flashcard learning system', disabled: false },
    { value: 'quizlet', label: 'Quizlet', description: 'Coming Soon', disabled: true },
    { value: 'memrise', label: 'Memrise', description: 'Coming Soon', disabled: true }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fileFormatDropdownRef.current && !fileFormatDropdownRef.current.contains(event.target)) {
        setFileFormatDropdownOpen(false);
      }
      if (platformDropdownRef.current && !platformDropdownRef.current.contains(event.target)) {
        setPlatformDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setFileFormatDropdownOpen(false);
      setPlatformDropdownOpen(false);
      onClose();
    }
  };

  const generateAnkiFormat = (data) => {
    const ankiData = data.map(word => {
      const front = word.word;
      const back = `
        <div style="font-family: Arial, sans-serif;">
          <div style="font-size: 18px; color: #2563eb; margin-bottom: 8px;">${word.translation || 'No translation'}</div>
          ${word.pronunciation ? `<div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">[${word.pronunciation}]</div>` : ''}
          ${word.definition ? `<div style="font-size: 14px; line-height: 1.4; margin-bottom: 8px;">${word.definition}</div>` : ''}
          ${includeImages && word.image ? `<img src="${word.image}" style="max-width: 200px; max-height: 150px; border-radius: 8px; margin-top: 8px;" alt="${word.word}">` : ''}
        </div>
      `;
      return `${front}\t${back}`;
    }).join('\n');
    
    return ankiData;
  };

  const handleExport = () => {
    const data = set.words.map(word => ({
      word: word.word,
      ...(includeTranslations && { translation: word.translation }),
      ...(includePronunciation && { pronunciation: word.pronunciation }),
      definition: word.definition,
      ...(includeImages && { image: word.image }),
      ...(includeTimestamps && { timestamp: word.timestamp || new Date().toISOString() })
    }));

    let content, filename, mimeType;

    if (exportType === 'platform' && platform === 'anki') {
      content = generateAnkiFormat(data);
      filename = `${set.name}_anki.txt`;
      mimeType = 'text/plain';
    } else {
      switch (fileFormat) {
        case 'csv':
          const headers = ['word', 
            ...(includeTranslations ? ['translation'] : []),
            ...(includePronunciation ? ['pronunciation'] : []),
            'definition',
            ...(includeImages ? ['image'] : []),
            ...(includeTimestamps ? ['timestamp'] : [])
          ];
          const csvRows = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
          ];
          content = csvRows.join('\n');
          filename = `${set.name}.csv`;
          mimeType = 'text/csv';
          break;
        
        case 'txt':
          content = data.map(word => {
            let line = `${word.word}`;
            if (includeTranslations && word.translation) line += ` - ${word.translation}`;
            if (includePronunciation && word.pronunciation) line += ` [${word.pronunciation}]`;
            line += `\nDefinition: ${word.definition}`;
            if (includeImages && word.image) line += `\nImage: ${word.image}`;
            if (includeTimestamps && word.timestamp) line += `\nAdded: ${word.timestamp}`;
            return line;
          }).join('\n\n');
          filename = `${set.name}.txt`;
          mimeType = 'text/plain';
          break;
        
        default:
          content = JSON.stringify(data, null, 2);
          filename = `${set.name}.json`;
          mimeType = 'application/json';
      }
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onExport();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl flex-shrink-0">
          <h2 className="text-xl font-bold">Export Vocabulary Set</h2>
          <p className="text-blue-100 mt-1">"{set.name}" - {set.words.length} words</p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f8fafc'
        }}>
          <style dangerouslySetInnerHTML={{
            __html: `
              .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #f8fafc;
                border-radius: 4px;
                margin: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: linear-gradient(to bottom, #e2e8f0, #cbd5e1);
                border-radius: 4px;
                border: 1px solid #f1f5f9;
                transition: all 0.2s ease;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(to bottom, #cbd5e1, #94a3b8);
                border-color: #e2e8f0;
              }
            `
          }} />
          <div className="p-6 space-y-6">
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Export Type</label>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="radio"
                    id="export-file"
                    value="file"
                    checked={exportType === 'file'}
                    onChange={(e) => setExportType(e.target.value)}
                    className="sr-only"
                  />
                  <label 
                    htmlFor="export-file"
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      exportType === 'file' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      exportType === 'file' ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {exportType === 'file' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">File Export</div>
                      <div className="text-sm text-gray-500">Download as a file format</div>
                    </div>
                  </label>
                </div>
                
                <div className="relative">
                  <input
                    type="radio"
                    id="export-platform"
                    value="platform"
                    checked={exportType === 'platform'}
                    onChange={(e) => setExportType(e.target.value)}
                    className="sr-only"
                  />
                  <label 
                    htmlFor="export-platform"
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      exportType === 'platform' 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      exportType === 'platform' ? 'border-purple-500' : 'border-gray-300'
                    }`}>
                      {exportType === 'platform' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">Platform Export</div>
                      <div className="text-sm text-gray-500">Export for specific learning platforms</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {exportType === 'file' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">File Format</label>
                <div className="relative" ref={fileFormatDropdownRef}>
                  <button
                    onClick={() => setFileFormatDropdownOpen(!fileFormatDropdownOpen)}
                    className="w-full p-4 pr-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-700 font-medium flex items-center justify-between hover:border-gray-300"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-gray-900">{fileFormats.find(f => f.value === fileFormat)?.label}</span>
                      <span className="text-sm text-gray-500">{fileFormats.find(f => f.value === fileFormat)?.description}</span>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${fileFormatDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {fileFormatDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-20 py-2 max-h-60 overflow-y-auto">
                      {fileFormats.map((format) => (
                        <button
                          key={format.value}
                          onClick={() => {
                            setFileFormat(format.value);
                            setFileFormatDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 transition-colors duration-150 flex flex-col ${
                            fileFormat === format.value 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="font-medium">{format.label}</span>
                          <span className="text-sm text-gray-500">{format.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Platform</label>
                <div className="relative" ref={platformDropdownRef}>
                  <button
                    onClick={() => setPlatformDropdownOpen(!platformDropdownOpen)}
                    className="w-full p-4 pr-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-gray-700 font-medium flex items-center justify-between hover:border-gray-300"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-gray-900">{platforms.find(p => p.value === platform)?.label}</span>
                      <span className="text-sm text-gray-500">{platforms.find(p => p.value === platform)?.description}</span>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${platformDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {platformDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-20 py-2 max-h-60 overflow-y-auto">
                      {platforms.map((platformOption) => (
                        <button
                          key={platformOption.value}
                          onClick={() => {
                            if (!platformOption.disabled) {
                              setPlatform(platformOption.value);
                              setPlatformDropdownOpen(false);
                            }
                          }}
                          disabled={platformOption.disabled}
                          className={`w-full text-left px-4 py-3 transition-colors duration-150 flex flex-col ${
                            platformOption.disabled 
                              ? 'opacity-50 cursor-not-allowed' 
                              : platform === platformOption.value 
                                ? 'bg-purple-50 text-purple-700' 
                                : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="font-medium">{platformOption.label}</span>
                          <span className="text-sm text-gray-500">{platformOption.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">Include Data</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-start">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={includeTranslations}
                      onChange={(e) => setIncludeTranslations(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all duration-200 ${
                      includeTranslations 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}>
                      {includeTranslations && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Translations</div>
                    <div className="text-xs text-gray-500">Word meanings</div>
                  </div>
                </label>
                
                <label className="flex items-start">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={includePronunciation}
                      onChange={(e) => setIncludePronunciation(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all duration-200 ${
                      includePronunciation 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}>
                      {includePronunciation && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Pronunciation</div>
                    <div className="text-xs text-gray-500">Phonetic guides</div>
                  </div>
                </label>
                
                <label className="flex items-start">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all duration-200 ${
                      includeImages 
                        ? 'bg-purple-500 border-purple-500' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}>
                      {includeImages && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Images</div>
                    <div className="text-xs text-gray-500">Visual aids</div>
                  </div>
                </label>
                
                <label className="flex items-start">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={includeTimestamps}
                      onChange={(e) => setIncludeTimestamps(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all duration-200 ${
                      includeTimestamps 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}>
                      {includeTimestamps && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Timestamps</div>
                    <div className="text-xs text-gray-500">When added</div>
                  </div>
                </label>
              </div>
            </div>

            {exportType === 'platform' && platform === 'anki' && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-start">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-purple-800 mb-2">Anki Import Instructions</h4>
                    <div className="space-y-1 text-sm text-purple-700">
                      <p>• Import using <strong>File → Import</strong> in Anki</p>
                      <p>• Format: Tab-separated with HTML support</p>
                      <p>• {includeImages ? 'Images will be embedded in cards' : 'Enable images to include visual aids'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-xl flex-shrink-0 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            Export {exportType === 'platform' ? `to ${platform}` : fileFormat.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;