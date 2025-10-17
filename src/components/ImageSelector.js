/**
 * ImageSelector Component
 * 
 * VERSION: 2.0.1
 * UPDATES:
 * - A      // IMPORTANT: We always want to us      // Check if we have         // We have an English translation, use it directly
        searchTerm = englishTranslation;
        console.log(`📸 Using provided English translation for search: "${searchTerm}"`);
        results = await searchImages(searchTerm, 10, false, 'English');
      } else if (sourceLanguage === 'English') {
        // Source is already English, use the original word
        searchTerm = word;
        console.log(`📸 Source language is English, using original word: "${searchTerm}"`);
        results = await searchImages(searchTerm, 10, false, 'English');
      } else {
        // No translation available and not English source - need to translate
        console.log(`📸 Need to translate before searching: "${word}" from ${sourceLanguage}`);
      }anslation (in the definition field)
      let searchTerm;
      let needTranslation = false;
      
      if (englishTranslation && englishTranslation.trim() !== '') {
        // We have the English translation in the definition field, use it directly
        searchTerm = englishTranslation;
        console.log(`📸 Using definition field as English translation: "${searchTerm}"`);
      } else if (sourceLanguage === 'English') {
        // Source is already English, use the original word
        searchTerm = word;
        console.log(`📸 Source language is English, using original word: "${searchTerm}"`);
      } else {
        // No translation available and we have a non-English source language
        // Need to translate the word
        needTranslation = true;
        searchTerm = word; // Will be translated
        console.log(`📸 No translation available for non-English word, will translate: "${word}"`);
      }on if available,
      // since it was provided by the AI model during word creation
      let searchTerm;
      
      if (englishTranslation && englishTranslation.trim() !== '') {
        // We have an English translation, use it directly
        searchTerm = englishTranslation;
        console.log(`📸 Using provided English translation for search: "${searchTerm}"`);
      } else if (sourceLanguage === 'English') {
        // Source is already English, use the original word
        searchTerm = word;
        console.log(`📸 Source language is English, using original word: "${searchTerm}"`);
      } else {
        // No translation available and not English source - we need to translate it
        console.log(`📸 No translation available for "${word}", attempting to translate from ${sourceLanguage}...`);
        
        try {
          // Get the translation directly
          const { translateToEnglish } = await import('../services/imageSearch');
          const translatedTerm = await translateToEnglish(word, sourceLanguage);
          console.log(`📸 Successfully translated: "${word}" → "${translatedTerm}"`);
          
          if (translatedTerm && translatedTerm !== word) {
            searchTerm = translatedTerm;
            
            // Save the translation for future use
            if (onEnglishTranslationUpdate) {
              onEnglishTranslationUpdate(translatedTerm);
              console.log(`📸 Saving translation for future use: "${translatedTerm}"`);
            }
          } else {
            searchTerm = word;
            console.log(`📸 Using original word as fallback: "${searchTerm}"`);
          }
        } catch (error) {
          console.error('📸 Translation failed:', error);
          searchTerm = word; // Fallback to original word
          console.log(`📸 Translation failed, using original word: "${searchTerm}"`);
        }
      } to prevent interactions during saving
 * - Added proper handling of English translations
 * - Fixed stability issues with unmounting during save operations
 * - Improved error handling for save operations
 */

import React, { useState, useEffect, useRef } from 'react';
import { searchImages } from '../services/imageSearch';

const ImageSelector = ({ 
  word, 
  englishTranslation, // English translation for image search
  currentImageUrl, 
  searchResults = [], 
  selectedIndex: initialSelectedIndex = 0,
  onImageSelect, 
  onImageRemove,
  onSearchResults,
  onEnglishTranslationUpdate, // ✅ New callback to update English translation in parent
  compact = false, // Compact mode for preview cards
  sourceLanguage = 'English', // Source language for translation
  disabled = false // Disable interactions during saving
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [imageResults, setImageResults] = useState(searchResults);
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [showResults, setShowResults] = useState(searchResults.length > 0);
  const [error, setError] = useState(null);
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Sync with parent state when props change
  useEffect(() => {
    console.log('📥 Syncing from parent:', searchResults.length, 'results');
    setImageResults(searchResults);
    setSelectedIndex(initialSelectedIndex);
    setShowResults(searchResults.length > 0);
  }, [searchResults, initialSelectedIndex]);

  // Debug: Log when component mounts/unmounts and when imageResults change
  useEffect(() => {
    console.log('🎬 ImageSelector mounted for word:', word, 'englishTranslation:', englishTranslation);
    return () => console.log('🎬 ImageSelector unmounted for word:', word);
  }, [word, englishTranslation]);

  useEffect(() => {
    console.log(`📦 imageResults updated: ${imageResults.length} results`);
  }, [imageResults]);

  // Don't auto-initialize with current image - let user search instead
  // The currentImageUrl is used for display only when no search results exist

  const handleSearchImages = async () => {
    if (!word || !word.trim() || disabled) {
      setError('Please enter a word first');
      return;
    }

    console.log(`📸 ======= IMAGE SELECTOR SEARCH =======`);
    console.log(`📸 Word: "${word}"`);
    console.log(`📸 English Translation: "${englishTranslation || 'not set'}"`);
    console.log(`📸 Source Language: "${sourceLanguage}"`);
    console.log(`📸 Using definition field:`, !!englishTranslation);
    setIsSearching(true);
    setError(null);

    try {
      // Determine search strategy based on available translations
      let searchTerm;
      let results;
      
      if (englishTranslation && englishTranslation.trim() !== '') {
        // We have an English translation, use it directly
        searchTerm = englishTranslation;
        console.log(`� Using provided English translation for search: "${searchTerm}"`);
      } else if (sourceLanguage === 'English') {
        // Source is already English, use the original word
        searchTerm = word;
        console.log(`📸 Source language is English, using original word: "${searchTerm}"`);
      } else {
        // No translation available and not English source - this shouldn't happen
        // with your setup, but handle it just in case
        searchTerm = word;
        console.log(`� No translation available, defaulting to original word: "${searchTerm}"`);
      }
      
      // Define needTranslation based on available data
      const needTranslation = !englishTranslation && sourceLanguage !== 'English';
      
      if (needTranslation) {
        // We need to translate the word before searching
        console.log(`🔍 Searching with translation: "${word}" from ${sourceLanguage}`);
        
        // Using searchImages with translateToEn=true will translate first, then search
        results = await searchImages(word, 10, true, sourceLanguage);
        
        // Try to get and save the translated term for future use
        try {
          const { translateToEnglish } = await import('../services/imageSearch');
          const translatedTerm = await translateToEnglish(word, sourceLanguage);
          
          if (translatedTerm && translatedTerm !== word && onEnglishTranslationUpdate) {
            console.log(`📸 Got translation result: "${translatedTerm}", saving to definition field`);
            onEnglishTranslationUpdate(translatedTerm);
          }
        } catch (error) {
          console.error('📸 Failed to get translation for future use:', error);
        }
      } else {
        // No translation needed, search directly
        console.log(`🔍 Using search term directly: "${searchTerm}"`);
        results = await searchImages(searchTerm, 10, false, 'English');
      }
      console.log(`📸 ImageSelector: Received ${results.length} results`);
      
      if (results.length === 0) {
        setError('No images found. Try uploading or pasting a URL.');
        setImageResults([]);
        setShowResults(false);
        if (onSearchResults) onSearchResults([], 0);
      } else {
        setImageResults(results);
        setSelectedIndex(0);
        setShowResults(true);
        console.log(`📸 ImageSelector: Auto-selecting first image`);
        
        // Notify parent of search results
        if (onSearchResults) {
          onSearchResults(results, 0);
        }
        
        // Auto-select the first image
        if (onImageSelect) {
          onImageSelect(results[0].url);
        }
      }
    } catch (err) {
      console.error('📸 ImageSelector: Search error:', err);
      // Show friendly message instead of technical error
      setError('Could not search for images. Try uploading or pasting a URL.');
      setImageResults([]);
      setShowResults(false);
      if (onSearchResults) onSearchResults([], 0);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNextImage = () => {
    if (imageResults.length === 0) return;
    
    const nextIndex = (selectedIndex + 1) % imageResults.length;
    console.log(`📸 ImageSelector: Next image (${selectedIndex} → ${nextIndex})`);
    setSelectedIndex(nextIndex);
    
    // Notify parent of index change
    if (onSearchResults) {
      onSearchResults(imageResults, nextIndex);
    }
    
    if (onImageSelect) {
      onImageSelect(imageResults[nextIndex].url);
    }
  };

  const handlePreviousImage = () => {
    if (imageResults.length === 0) return;
    
    const prevIndex = selectedIndex === 0 ? imageResults.length - 1 : selectedIndex - 1;
    console.log(`📸 ImageSelector: Previous image (${selectedIndex} → ${prevIndex})`);
    setSelectedIndex(prevIndex);
    
    // Notify parent of index change
    if (onSearchResults) {
      onSearchResults(imageResults, prevIndex);
    }
    
    if (onImageSelect) {
      onImageSelect(imageResults[prevIndex].url);
    }
  };

  const handleCustomUrl = () => {
    if (customUrl.trim() && onImageSelect) {
      // Always allow replacing existing image with new URL without needing to remove it first
      onImageSelect(customUrl.trim());
      
      // Reset UI state
      setCustomUrl('');
      setShowUrlInput(false);
      
      // Reset search results when manually setting URL
      if (imageResults.length > 0) {
        setImageResults([]);
        setShowResults(false);
        if (onSearchResults) {
          onSearchResults([], 0);
        }
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (onImageSelect) {
          // Always allow replacing existing image without needing to remove first
          onImageSelect(reader.result); // Base64 data URL
          
          // Reset search results when uploading a file
          if (imageResults.length > 0) {
            setImageResults([]);
            setShowResults(false);
            if (onSearchResults) {
              onSearchResults([], 0);
            }
          }
        }
      };
      reader.readAsDataURL(file);
      
      // Reset the file input so the same file can be uploaded again if needed
      event.target.value = '';
    }
  };

  const currentImage = imageResults[selectedIndex];
  // Show search results if available, otherwise show the current image
  const displayImageUrl = showResults && currentImage ? currentImage.url : currentImageUrl;
  
  // Create wrapped handlers that respect the disabled prop
  const safeHandleSearchImages = disabled ? () => {} : handleSearchImages;
  // Use direct props instead of undefined handlers
  const safeHandleToggleUrlInput = disabled ? () => {} : () => setShowUrlInput(!showUrlInput);
  const safeHandleUrlSubmit = disabled ? () => {} : handleCustomUrl;
  const safeHandleFileUpload = disabled ? () => {} : handleFileUpload;
  const safeHandlePrev = disabled ? () => {} : handlePreviousImage;
  const safeHandleNext = disabled ? () => {} : handleNextImage;

  console.log('🖼️ ImageSelector render:', {
    word,
    englishTranslation,
    sourceLanguage,
    imageResultsLength: imageResults.length,
    selectedIndex,
    showResults,
    hasCurrentImage: !!currentImage,
    displayImageUrl: displayImageUrl?.substring(0, 50),
    disabled
  });

  return (
    <div className="space-y-3">
      {/* Current Image Display with Navigation Arrows or Placeholder */}
      {displayImageUrl ? (
        <div className="relative group">
          <img
            src={displayImageUrl}
            alt={word}
            className="w-full h-40 object-cover rounded-lg"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
          
          {/* Navigation Arrows - Show when multiple results exist */}
          {imageResults.length > 1 && (
            <>
              {/* Previous Button - Left Side */}
              <button
                onClick={safeHandlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                title="Previous image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Next Button - Right Side */}
              <button
                onClick={safeHandleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                title="Next image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Image Counter */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                {selectedIndex + 1} / {imageResults.length}
              </div>
            </>
          )}
          
          {/* Remove Button - Top Right */}
          <button
            onClick={disabled ? () => {} : onImageRemove}
            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        /* No Image Placeholder - Dotted Border */
        <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No image</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={`flex ${compact ? 'gap-1' : 'flex-wrap gap-2'}`}>
        {/* Search Button */}
        <button
          onClick={safeHandleSearchImages}
          disabled={isSearching || !word || disabled}
          className={`${compact ? 'flex-1 px-2 py-1.5 text-xs' : 'flex-1 px-3 py-2 text-sm'} inline-flex items-center justify-center font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors`}
        >
          {isSearching ? (
            <>
              <svg className={`${compact ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'} animate-spin`} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {compact ? '...' : 'Searching...'}
            </>
          ) : (
            <>
              <svg className={`${compact ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {compact ? 'Search' : (showResults && imageResults.length > 0 ? 'Search Again' : currentImageUrl ? 'Search Again' : 'Search Image')}
            </>
          )}
        </button>

        {/* URL Button */}
        <button
          onClick={safeHandleToggleUrlInput}
          disabled={disabled}
          className={`${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} font-medium rounded-lg ${showUrlInput ? 'bg-green-700' : 'bg-green-600'} text-white hover:bg-green-700 transition-colors inline-flex items-center justify-center`}
          title="Paste image URL"
        >
          <svg className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} ${compact ? '' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {!compact && 'URL'}
        </button>

        {/* Upload File Button */}
        <label className={`${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} font-medium rounded-lg ${disabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'} text-white transition-colors inline-flex items-center justify-center`}
          title="Upload image from device"
        >
          <svg className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} ${compact ? '' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {!compact && 'Upload'}
          <input
            type="file"
            accept="image/*"
            onChange={safeHandleFileUpload}
            disabled={disabled}
            className="hidden"
          />
        </label>
      </div>

      {/* Custom URL Input */}
      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => !disabled && setCustomUrl(e.target.value)}
            readOnly={disabled}
            placeholder="Paste image URL..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            onKeyPress={(e) => e.key === 'Enter' && safeHandleUrlSubmit()}
            autoFocus
          />
          <button
            onClick={safeHandleUrlSubmit}
            disabled={!customUrl.trim() || disabled}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      )}

      {/* Image Counter */}
      {imageResults.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          Image {selectedIndex + 1} of {imageResults.length}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </p>
      )}
    </div>
  );
};

// Update all event handlers to check disabled state first
const withDisabledCheck = (handler, isDisabled) => {
  if (!handler) return undefined;
  return (...args) => {
    if (isDisabled) return;
    return handler(...args);
  };
};

export default ImageSelector;
