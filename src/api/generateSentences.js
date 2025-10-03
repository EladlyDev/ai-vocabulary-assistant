/**
 * API Endpoint: Generate Example Sentences using Google Gemini AI
 * 
 * This serverless function handles AI sentence generation securely
 * without exposing API keys to the client.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_AI_API_KEY);

/**
 * Generate example sentences for multiple words
 * @param {Array<string>} words - Array of words to generate sentences for
 * @param {string} language - Target language (e.g., "English", "Spanish")
 * @returns {Promise<Object>} Object mapping words to their sentences
 */
async function generateSentencesForWords(words, language = 'English') {
  try {
    // Use Gemini 1.5 Flash for fast, efficient generation
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Construct the prompt
    const prompt = `You are a helpful language learning assistant. I will provide you with a list of words in ${language}. For each word, generate a single, clear, contextually appropriate, and natural example sentence that demonstrates the word's meaning and usage.

CRITICAL: Your response MUST be a valid JSON object where the keys are the original words (exactly as provided) and the values are the generated sentences. Do not include any markdown formatting, code blocks, or explanatory text - ONLY the raw JSON object.

Language: ${language}
Words: ${JSON.stringify(words)}

Example Response Format (respond with ONLY this structure, no markdown):
{
  "word1": "Example sentence using word1 in context.",
  "word2": "Example sentence using word2 in context."
}

Generate the sentences now:`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response - remove markdown code blocks if present
    let cleanText = text.trim();
    
    // Remove markdown code blocks (```json ... ```)
    cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to parse the JSON response
    let sentencesMap;
    try {
      sentencesMap = JSON.parse(cleanText);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        sentencesMap = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    // Validate that all words have sentences
    const missingSentences = words.filter(word => !sentencesMap[word]);
    if (missingSentences.length > 0) {
      console.warn('Missing sentences for words:', missingSentences);
      // Fill in missing sentences with a default
      missingSentences.forEach(word => {
        sentencesMap[word] = `Example: ${word} is commonly used in everyday conversation.`;
      });
    }

    return sentencesMap;
  } catch (error) {
    console.error('Error generating sentences:', error);
    throw new Error(`Failed to generate sentences: ${error.message}`);
  }
}

/**
 * HTTP Handler for the API endpoint
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Parse request body
    const { words, language = 'English' } = req.body;

    // Validate input
    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request. Please provide an array of words.' 
      });
    }

    // Limit to 50 words per request to avoid timeouts
    if (words.length > 50) {
      return res.status(400).json({ 
        error: 'Too many words. Please limit to 50 words per request.' 
      });
    }

    // Filter out empty words
    const validWords = words.filter(word => word && word.trim());
    
    if (validWords.length === 0) {
      return res.status(400).json({ 
        error: 'No valid words provided.' 
      });
    }

    // Generate sentences
    const sentences = await generateSentencesForWords(validWords, language);

    // Return success response
    return res.status(200).json({
      success: true,
      sentences,
      count: Object.keys(sentences).length
    });

  } catch (error) {
    console.error('API Error:', error);
    
    // Return error response
    return res.status(500).json({
      success: false,
      error: 'Failed to generate sentences. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Export the function for direct use (non-API context)
module.exports = { generateSentencesForWords, handler };
