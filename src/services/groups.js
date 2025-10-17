import { supabase } from '../lib/supabase';
import { handleSupabaseError } from './database';

/**
 * Get all groups for the current user
 */
export const fetchGroups = async () => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    handleSupabaseError(error, 'fetch groups');
  }

  return data || [];
};

/**
 * Create a new group
 */
export const createGroup = async (groupData) => {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Get the highest display_order for this user
  const { data: existingGroups } = await supabase
    .from('groups')
    .select('display_order')
    .eq('user_id', user.id)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = existingGroups && existingGroups.length > 0 
    ? existingGroups[0].display_order + 1 
    : 0;

  const { data, error } = await supabase
    .from('groups')
    .insert([{
      user_id: user.id,
      name: groupData.name,
      color: groupData.color || 'blue',
      display_order: nextOrder
    }])
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'create group');
    throw error; // Ensure error is thrown
  }

  if (!data) {
    throw new Error('No data returned from group creation');
  }

  return data;
};

/**
 * Update an existing group
 */
export const updateGroup = async (groupId, updates) => {
  // Remove fields that shouldn't be updated
  const { id, user_id, created_at, sets, ...safeUpdates } = updates;
  
  const { data, error } = await supabase
    .from('groups')
    .update({
      ...safeUpdates,
      updated_at: new Date().toISOString()
    })
    .eq('id', groupId)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'update group');
  }

  return data;
};

/**
 * Delete a group
 */
export const deleteGroup = async (groupId) => {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);

  if (error) {
    handleSupabaseError(error, 'delete group');
  }

  return true;
};

/**
 * Update display order for multiple groups
 */
export const updateGroupsOrder = async (groupsWithOrder) => {
  try {
    // Filter out groups with temporary IDs (not yet saved to database)
    const savedGroups = groupsWithOrder.filter(group => 
      group.id && !group.id.toString().startsWith('temp-')
    );
    
    // Update each saved group's display_order
    const updates = savedGroups.map(async (group, index) => {
      const { error } = await supabase
        .from('groups')
        .update({ display_order: index })
        .eq('id', group.id);
      
      if (error) throw error;
    });

    await Promise.all(updates);
    return true;
  } catch (error) {
    handleSupabaseError(error, 'update groups order');
  }
};
