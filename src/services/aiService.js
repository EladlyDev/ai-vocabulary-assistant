/**
 * AI Service - Client-side wrapper for AI-powered features
 * Handles communication with Google Gemini AI
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_AI_API_KEY);

/**
 * Process words with AI - generates translation, example sentence, and sentence translation
 * @param {Array<string>} words - Array of words to process
 * @param {string} sourceLanguage - Source language of the words
 * @param {string} targetLanguage - Target language for translations
 * @returns {Promise<Object>} Object mapping words to their complete data
 */
export const processWordsWithAI = async (words, sourceLanguage = 'English', targetLanguage = 'English') => {
  try {
    // Validate input
    if (!words || words.length === 0) {
      throw new Error('No words provided');
    }

    if (words.length > 50) {
      throw new Error('Too many words. Please process in batches of 50 or fewer.');
    }

    // Use Gemini 2.0 Flash for generation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Construct the comprehensive prompt
    const prompt = `You are a helpful language learning assistant. I will provide you with a list of words in ${sourceLanguage}. For each word, you need to generate:
1. Translation to ${targetLanguage}
2. An example sentence using the word in ${sourceLanguage}
3. Translation of that example sentence to ${targetLanguage}

CRITICAL: Your response MUST be a valid JSON object where the keys are the original words (exactly as provided) and the values are objects with "translation", "sentence", and "sentenceTranslation" properties. Do not include any markdown formatting, code blocks, or explanatory text - ONLY the raw JSON object.

Source Language: ${sourceLanguage}
Target Language: ${targetLanguage}
Words: ${JSON.stringify(words)}

Example Response Format (respond with ONLY this structure, no markdown):
{
  "word1": {
    "translation": "translation of word1 in ${targetLanguage}",
    "sentence": "Example sentence using word1 in ${sourceLanguage}.",
    "sentenceTranslation": "Translation of the example sentence in ${targetLanguage}."
  },
  "word2": {
    "translation": "translation of word2 in ${targetLanguage}",
    "sentence": "Example sentence using word2 in ${sourceLanguage}.",
    "sentenceTranslation": "Translation of the example sentence in ${targetLanguage}."
  }
}

Generate the complete data now:`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response - remove markdown code blocks if present
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    cleanText = cleanText.trim();

    // Parse the JSON response
    const processedWords = JSON.parse(cleanText);

    // Verify all words got processed
    const missingWords = words.filter(word => !processedWords[word]);
    if (missingWords.length > 0) {
      // Fill in missing words with placeholders
      missingWords.forEach(word => {
        processedWords[word] = {
          translation: 'Translation pending',
          sentence: `Example sentence with ${word}.`,
          sentenceTranslation: 'Sentence translation pending'
        };
      });
    }

    return {
      success: true,
      words: processedWords,
      count: Object.keys(processedWords).length
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to process words. Please try again.');
  }
};

/**
 * Batch process words in chunks to avoid timeouts
 * @param {Array<string>} words - Array of words
 * @param {string} sourceLanguage - Source language
 * @param {string} targetLanguage - Target language
 * @param {number} chunkSize - Size of each batch (default: 20)
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<Object>} Combined processed words object
 */
export const processWordsInBatches = async (
  words, 
  sourceLanguage = 'English',
  targetLanguage = 'English', 
  chunkSize = 20,
  onProgress = null
) => {
  const allProcessedWords = {};
  const chunks = [];
  
  // Split words into chunks
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize));
  }
  
  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    try {
      const result = await processWordsWithAI(chunks[i], sourceLanguage, targetLanguage);
      Object.assign(allProcessedWords, result.words);
      
      // Call progress callback
      if (onProgress) {
        const processedCount = Math.min((i + 1) * chunkSize, words.length);
        onProgress(processedCount, words.length);
      }
    } catch (error) {
      // Continue with other chunks even if one fails
      // Fill failed words with placeholders
      chunks[i].forEach(word => {
        if (!allProcessedWords[word]) {
          allProcessedWords[word] = {
            translation: 'Error',
            sentence: 'Failed to generate',
            sentenceTranslation: 'Error'
          };
        }
      });
    }
  }
  
  return {
    success: true,
    words: allProcessedWords,
    count: Object.keys(allProcessedWords).length
  };
};
