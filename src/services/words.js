import { supabase } from '../lib/supabase';
import { handleSupabaseError } from './database';

/**
 * Get all words for a specific set
 */
export const fetchWordsBySet = async (setId) => {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('set_id', setId)
    .order('created_at', { ascending: true });

  if (error) {
    handleSupabaseError(error, 'fetch words');
  }

  // Map database fields to UI format (snake_case to camelCase)
  const mappedData = (data || []).map(word => ({
    ...word,
    translation: word.definition, // Map definition to translation
    sentenceTranslation: word.sentence_translation, // Map to camelCase
    image: word.image_url, // Map image_url to image for UI
    // Keep other fields as-is (example, sentence, pronunciation, etc.)
  }));

  return mappedData;
};

/**
 * Create a new word
 */
export const createWord = async (wordData) => {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Build insert object - map translation to definition for database
  const insertData = {
    user_id: user.id,
    set_id: wordData.set_id,
    word: wordData.word,
    definition: wordData.translation || wordData.definition || '',
    sentence: wordData.sentence || null,
    sentence_translation: wordData.sentence_translation || null,
    example: wordData.example || null,
    image_url: wordData.image_url || null,
    pronunciation: wordData.pronunciation || null,
    synonyms: wordData.synonyms || [],
    antonyms: wordData.antonyms || [],
    position: wordData.position || 0, // Default to 0 instead of null
    // Skip english_translation as the column doesn't exist in the database
  };

  const { data, error } = await supabase
    .from('words')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'create word');
    throw error;
  }

  return data;
};

/**
 * Update an existing word
 */
export const updateWord = async (wordId, updates) => {
  // Remove fields that shouldn't be updated (but allow set_id to be updated for moving words)
  const { id, user_id, created_at, translation, sentenceTranslation, image, englishTranslation, ...safeUpdates } = updates;
  
  // Map UI fields to database fields
  const dbUpdates = {
    ...safeUpdates,
    updated_at: new Date().toISOString()
  };
  
  // Map translation to definition if present
  if (translation !== undefined) {
    dbUpdates.definition = translation;
  }
  
  // Map sentenceTranslation to sentence_translation if present
  if (sentenceTranslation !== undefined) {
    dbUpdates.sentence_translation = sentenceTranslation;
  }
  
  // Map image to image_url if present
  if (image !== undefined) {
    dbUpdates.image_url = image;
  }
  
  // Only include english_translation if we know the column exists in the database
  // Currently, we'll skip this since the column doesn't exist yet
  // If you need to store this data, consider adding it to a separate table or JSON field
  // or run a database migration to add this column
  /* 
  if (englishTranslation !== undefined) {
    dbUpdates.english_translation = englishTranslation;
  }
  */
  
  const { data, error } = await supabase
    .from('words')
    .update(dbUpdates)
    .eq('id', wordId)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'update word');
    throw error;
  }

  // Map database fields back to UI format
  return {
    ...data,
    translation: data.definition,
    sentenceTranslation: data.sentence_translation,
    image: data.image_url,
    englishTranslation: data.english_translation
  };
};

/**
 * Delete a word
 */
export const deleteWord = async (wordId) => {
  const { error } = await supabase
    .from('words')
    .delete()
    .eq('id', wordId);

  if (error) {
    handleSupabaseError(error, 'delete word');
  }

  return true;
};

/**
 * Delete all words in a set
 */
export const deleteWordsBySet = async (setId) => {
  const { error } = await supabase
    .from('words')
    .delete()
    .eq('set_id', setId);

  if (error) {
    handleSupabaseError(error, 'delete words by set');
  }

  return true;
};
