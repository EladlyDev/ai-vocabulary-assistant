import { supabase } from '../lib/supabase';

/**
 * Base database utilities
 */

/**
 * Handle Supabase errors consistently
 */
export const handleSupabaseError = (error, operation) => {
  console.error(`Database error during ${operation}:`, error);
  console.error('Error details:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code
  });
  
  if (error.code === 'PGRST116') {
    throw new Error('No data found');
  }
  
  if (error.code === '23505') {
    throw new Error('This item already exists');
  }
  
  if (error.code === '23503') {
    throw new Error('Cannot delete: item has dependencies');
  }
  
  if (error.code === 'PGRST301') {
    throw new Error('Permission denied: Row Level Security policy violation');
  }
  
  throw new Error(error.message || `Failed to ${operation}`);
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new Error('Not authenticated');
  }
  
  return user;
};
