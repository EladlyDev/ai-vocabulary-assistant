/**
 * AI Service - Client-side wrapper for AI-powered features
 * Handles communication with Google Gemini AI
 * 
 * VERSION: 2.0.1
 * UPDATES:
 * - Added englishTranslation field to support better image searches
 * - Fixed proper preservation of fields when saving/updating words
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
export const processWordsWithAI = async (
  words, 
  sourceLanguage = 'English', 
  targetLanguage = 'English', 
  timestamp = null,
  regenerationInfo = null
) => {
  try {
    // Validate input
    if (!words || words.length === 0) {
      throw new Error('No words provided');
    }

    if (words.length > 50) {
      throw new Error('Too many words. Please process in batches of 50 or fewer.');
    }

    // Use Gemini 2.0 Flash for generation with temperature to ensure variety
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        // Maximum randomness for sentence regeneration
        temperature: timestamp ? 1.0 : 0.9, // Use maximum randomness when timestamp is provided (regeneration case)
        topP: timestamp ? 0.99 : 0.95,      // Higher values = more diversity
        topK: 50,                          // Higher value = more variety
        maxOutputTokens: 1024
      }
    });

    // Construct the comprehensive prompt
    const prompt = `You are a helpful language learning assistant. I will provide you with a list of words in ${sourceLanguage} language. For each word, you need to generate:
1. Translation of the word to ${targetLanguage} language
2. English translation of the word (if source language is not English, otherwise use the same word)
3. Example sentence using the word. CRITICALLY IMPORTANT: 
   - The example sentence MUST be written in ${sourceLanguage} language, not ${targetLanguage} language.
   - If the source language is English, the example sentence must be in English.
   - If the source language is Portuguese, the example sentence must be in Portuguese.
   - The sentence must be SIMPLE and EASY TO UNDERSTAND, regardless of word complexity.
   - Use basic vocabulary and grammar structures that a beginner or intermediate learner could understand.
   - Keep sentences concise (8-15 words) and straightforward with simple, clear contexts.
   - Avoid idioms, slang, or complex grammatical structures.
   - Each time this is called, create a new sentence, don't reuse previous sentences.
4. Translation of that example sentence to ${targetLanguage} language

CRITICAL: Your response MUST be a valid JSON object where the keys are the original words (exactly as provided) and the values are objects with "translation", "englishTranslation", "sentence", and "sentenceTranslation" properties. 

For example sentences, ALWAYS follow these guidelines regardless of word difficulty:
- Keep sentences simple and straightforward with basic grammar structures.
- Use common, everyday vocabulary that would be understood by beginners.
- Limit sentence length to about 8-15 words.
- Use simple tenses (present, simple past, simple future).
- Avoid complex clauses, idioms, or specialized vocabulary.
- Focus on clear, practical usage of the word in an everyday context.

Do not include any markdown formatting, code blocks, or explanatory text - ONLY the raw JSON object.

Source Language: ${sourceLanguage}
Target Language: ${targetLanguage}
Words: ${JSON.stringify(words)}

Example Response Format (respond with ONLY this structure, no markdown):
{
  "word1": {
    "translation": "translation of word1 in ${targetLanguage} language",
    "englishTranslation": "English translation of word1",
    "sentence": "MUST BE IN ${sourceLanguage} LANGUAGE: Simple example sentence using the word.",
    "sentenceTranslation": "MUST BE IN ${targetLanguage} LANGUAGE: Translation of the example sentence."
  },
  "word2": {
    "translation": "translation of word2 in ${targetLanguage} language",
    "englishTranslation": "English translation of word2",
    "sentence": "MUST BE IN ${sourceLanguage} LANGUAGE: Short easy-to-understand sentence using the word.",
    "sentenceTranslation": "MUST BE IN ${targetLanguage} LANGUAGE: Translation of that sentence."
  }
}

Generate the complete data now.

${regenerationInfo ? `VERY IMPORTANT: This is a REGENERATION request (timestamp: ${timestamp}). 
You MUST create completely DIFFERENT sentences than before for each word.
DO NOT return the same sentences as before under any circumstances.

CURRENT SENTENCE TO AVOID: "${regenerationInfo.currentContent}"

Create entirely new example sentences that have:
- Different contexts
- Different subjects
- Different situations
- Different themes

BUT all new sentences MUST ALWAYS BE:
- SIMPLE with basic grammar structures
- SHORT (8-15 words maximum)
- EASY to understand for beginners
- Using only COMMON everyday vocabulary
- Clear and practical
- Avoiding idioms or complex structures

Your new sentence MUST NOT resemble the current sentence but MUST remain SIMPLE regardless of word complexity.` : ''}

Important: Make sure to generate DIFFERENT sentences than you've generated before. Do not repeat previous sentences for this word.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response - remove markdown code blocks if present
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    cleanText = cleanText.trim();

    // Parse the JSON response
    const parsed = JSON.parse(cleanText);

    // Verify all words got processed
    const missingWords = words.filter(word => !parsed[word]);
    if (missingWords.length > 0) {
      // Fill in missing words with placeholders
      missingWords.forEach(word => {
        parsed[word] = {
          translation: 'Translation pending',
          sentence: `Example sentence with ${word}.`,
          sentenceTranslation: 'Sentence translation pending'
        };
      });
    }

    return {
      success: true,
      words: parsed,
      count: Object.keys(parsed).length
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
  onProgress = null,
  regenerationInfo = null
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
      // Add a timestamp to each batch to ensure different results
      const timestamp = new Date().getTime() + i;
      const result = await processWordsWithAI(
        chunks[i], 
        sourceLanguage, 
        targetLanguage, 
        timestamp, 
        regenerationInfo
      );
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
