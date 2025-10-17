/**
 * Google Custom Search API service for finding relevant images
 */

const GOOGLE_SEARCH_API_KEY = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID;

// Cache for search results to avoid duplicate API calls
const searchCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 1000; // Maximum number of cached queries

/**
 * Get cached search results if available and not expired
 */
const getCachedResults = (query) => {
  const cached = searchCache.get(query.toLowerCase());
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`✨ Using cached results for: "${query}"`);
    return cached.results;
  }
  return null;
};

/**
 * Save search results to cache
 */
const setCachedResults = (query, results) => {
  // Implement simple LRU by removing oldest entries if cache is full
  if (searchCache.size >= MAX_CACHE_SIZE) {
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
  }
  
  searchCache.set(query.toLowerCase(), {
    results,
    timestamp: Date.now()
  });
  console.log(`💾 Cached results for: "${query}" (Cache size: ${searchCache.size})`);
};

/**
 * Translate text to English using Google Translate API
 * @param {string} text - Text to translate
 * @param {string} sourceLanguage - Source language (optional, defaults to auto-detect)
 * @returns {Promise<string>} - Translated text in English
 */
export const translateToEnglish = async (text, sourceLanguage = 'auto') => {
  try {
    console.log(`🔄 Translating "${text}" from ${sourceLanguage} to English...`);
    
    // Map full language names to Google Translate API codes
    const languageCodeMap = {
      'English': 'en',
      'Spanish': 'es',
      'French': 'fr',
      'German': 'de',
      'Italian': 'it',
      'Portuguese': 'pt',
      'Russian': 'ru',
      'Arabic': 'ar',
      'Chinese (Mandarin)': 'zh',
      'Japanese': 'ja',
      'Korean': 'ko',
      'Hindi': 'hi',
      'Turkish': 'tr',
      'Dutch': 'nl',
      'Polish': 'pl',
      'Swedish': 'sv',
      'Norwegian': 'no',
      'Danish': 'da',
      'Finnish': 'fi',
      'Greek': 'el',
      'Hebrew': 'he',
      'Thai': 'th',
      'Vietnamese': 'vi',
      'Indonesian': 'id',
      'Malay': 'ms',
      'Filipino': 'tl',
      'Ukrainian': 'uk',
      'Czech': 'cs',
      'Romanian': 'ro',
      'Hungarian': 'hu',
      'Persian (Farsi)': 'fa',
      'Urdu': 'ur',
      'Bengali': 'bn',
      'Tamil': 'ta',
      'Telugu': 'te',
      'Swahili': 'sw'
    };
    
    // Convert language name to code if it's a full name
    const sourceLangCode = languageCodeMap[sourceLanguage] || sourceLanguage;
    console.log(`📝 Using language code: ${sourceLangCode}`);

    // Use Google Cloud Translation API with language detection
    const params = new URLSearchParams({
      key: GOOGLE_SEARCH_API_KEY, // Use the same API key
      q: text,
      target: 'en',
    });

    if (sourceLangCode !== 'auto' && sourceLangCode !== 'en') {
      params.append('source', sourceLangCode);
    }

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?${params.toString()}`,
      { method: 'POST' }
    );

    if (response.ok) {
      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;
      const detectedLanguage = data.data.translations[0].detectedSourceLanguage;
      
      // If already English, return original (cleaner than translated)
      if (detectedLanguage === 'en') {
        console.log(`✅ "${text}" is already in English, using original`);
        return text;
      }
      
      console.log(`✅ Translation successful: "${text}" (${detectedLanguage}) → "${translatedText}" (en)`);
      return translatedText;
    } else {
      const errorData = await response.json();
      console.error('❌ Translation API error:', errorData);
      return text;
    }
  } catch (error) {
    console.error('Translation failed:', error);
    return text;
  }
};

/**
 * Search for images using Google Custom Search API
 * @param {string} query - The search query (word to find images for)
 * @param {number} numResults - Number of results to fetch (default: 10)
 * @param {boolean} translateToEn - Whether to translate the query to English first (default: false)
 * @param {string} sourceLanguage - Source language for translation (optional)
 * @returns {Promise<Array>} - Array of image results with url, thumbnail, title, etc.
 */
export const searchImages = async (query, numResults = 10, translateToEn = false, sourceLanguage = 'auto') => {
  try {
    console.log(`🔍 ======= IMAGE SEARCH STARTED =======`);
    console.log(`🔍 Query: "${query}"`);
    console.log(`🔍 translateToEn: ${translateToEn}`);
    console.log(`🔍 sourceLanguage: "${sourceLanguage}"`);
    
    if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      throw new Error('Google Search API credentials not configured');
    }

    // Translate to English first if requested (for non-English words)
    let searchTerm = query;
    if (translateToEn && sourceLanguage !== 'English') {
      console.log(`📝 ✅ CONDITIONS MET - Will translate "${query}" from ${sourceLanguage} to English`);
      searchTerm = await translateToEnglish(query, sourceLanguage);
      console.log(`📝 Translation result: "${searchTerm}"`);
    } else {
      console.log(`📝 ❌ SKIPPING TRANSLATION - translateToEn=${translateToEn}, sourceLanguage="${sourceLanguage}"`);
    }

    // Check cache first (use original query as cache key)
    const cachedResults = getCachedResults(query);
    if (cachedResults) {
      return cachedResults.slice(0, numResults); // Return requested number from cache
    }

    // Append "illustration" to get better quality, more cartoon-like results
    let searchQuery = `${searchTerm} illustration`;
    console.log(`Using search query: "${searchQuery}" (API call will be made)`);
    

    const params = new URLSearchParams({
      key: GOOGLE_SEARCH_API_KEY,
      cx: GOOGLE_SEARCH_ENGINE_ID,
      q: searchQuery,
      searchType: 'image',
      num: Math.min(numResults, 10), // Google API max is 10 per request
      imgSize: 'medium', // medium size images
      safe: 'active', // Safe search
      rights: 'cc_publicdomain,cc_attribute,cc_sharealike', // Commercially usable licenses
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Search API error:', errorData);
      
      // Handle quota exceeded error silently - return empty results
      if (errorData.error?.code === 429 || errorData.error?.message?.includes('quota')) {
        console.warn('⚠️ API quota exceeded - returning empty results');
        return []; // Return empty array instead of throwing error
      }
      
      // For other errors, also return empty results (fail gracefully)
      console.warn('Search failed, returning empty results');
      return [];
    }

    const data = await response.json();

    // Transform the results into a simpler format
    if (data.items && data.items.length > 0) {
      const results = data.items.map(item => ({
        url: item.link,
        thumbnail: item.image?.thumbnailLink || item.link,
        title: item.title,
        width: item.image?.width,
        height: item.image?.height,
        contextLink: item.image?.contextLink, // The page where the image was found
      }));
      
      console.log(`✓ Found ${results.length} images`);
      
      // Cache the results
      setCachedResults(query, results);
      
      return results;
    }

    return [];
  } catch (error) {
    console.error('Image search error:', error);
    // Don't throw error - return empty results to fail gracefully
    return [];
  }
};

/**
 * Search for a single best image for a word
 * @param {string} word - The word to find an image for
 * @returns {Promise<string|null>} - URL of the best matching image or null
 */
export const searchSingleImage = async (word) => {
  try {
    const results = await searchImages(word, 1);
    return results.length > 0 ? results[0].url : null;
  } catch (error) {
    console.error(`Failed to fetch image for "${word}":`, error);
    return null;
  }
};

/**
 * Batch search images for multiple words
 * @param {Array<string>} words - Array of words to search for
 * @param {function} progressCallback - Optional callback for progress updates
 * @returns {Promise<Object>} - Object mapping words to their image results
 */
export const searchImagesForWords = async (words, progressCallback) => {
  const results = {};
  const total = words.length;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    try {
      // Search for images for this word
      const images = await searchImages(word, 10);
      results[word] = images;

      // Call progress callback if provided
      if (progressCallback) {
        progressCallback(i + 1, total);
      }

      // Add a small delay to avoid rate limiting (1 request per second)
      if (i < words.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
    } catch (error) {
      console.error(`Failed to fetch images for "${word}":`, error);
      results[word] = [];
    }
  }

  return results;
};
