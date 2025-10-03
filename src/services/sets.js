import { supabase } from '../lib/supabase';
import { handleSupabaseError } from './database';

/**
 * Get all sets for the current user with word counts
 */
export const fetchSets = async () => {
  // First fetch all sets
  const { data: setsData, error: setsError } = await supabase
    .from('sets')
    .select('*')
    .order('created_at', { ascending: true });

  if (setsError) {
    handleSupabaseError(setsError, 'fetch sets');
    return [];
  }

  // Then fetch word counts for each set
  const setsWithCounts = await Promise.all(
    (setsData || []).map(async (set) => {
      const { count, error: countError } = await supabase
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('set_id', set.id);

      return {
        ...set,
        word_count: countError ? 0 : (count || 0),
      };
    })
  );

  return setsWithCounts;
};

/**
 * Get sets for a specific group
 */
export const fetchSetsByGroup = async (groupId) => {
  const { data, error } = await supabase
    .from('sets')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) {
    handleSupabaseError(error, 'fetch sets by group');
  }

  return data || [];
};

/**
 * Create a new set
 */
export const createSet = async (setData) => {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('sets')
    .insert([{
      user_id: user.id,
      group_id: setData.group_id,
      name: setData.name,
      source_language: setData.source_language || 'Auto-detect',
      target_language: setData.target_language || 'English'
    }])
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'create set');
    throw error; // Ensure error is thrown
  }

  if (!data) {
    throw new Error('No data returned from set creation');
  }

  return data;
};

/**
 * Update an existing set
 */
export const updateSet = async (setId, updates) => {
  // Remove fields that shouldn't be updated
  const { id, user_id, created_at, ...safeUpdates } = updates;
  
  const { data, error } = await supabase
    .from('sets')
    .update({
      ...safeUpdates,
      updated_at: new Date().toISOString()
    })
    .eq('id', setId)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'update set');
  }

  return data;
};

/**
 * Delete a set
 */
export const deleteSet = async (setId) => {
  const { error } = await supabase
    .from('sets')
    .delete()
    .eq('id', setId);

  if (error) {
    handleSupabaseError(error, 'delete set');
  }

  return true;
};
