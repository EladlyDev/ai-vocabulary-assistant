import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from '../services/groups';
import {
  fetchSets,
  createSet,
  updateSet,
  deleteSet,
} from '../services/sets';
import {
  fetchWordsBySet,
  createWord,
  updateWord,
  deleteWord,
} from '../services/words';

/**
 * Hook to fetch all groups
 */
export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  });
};

/**
 * Hook to create a new group
 */
export const useCreateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,
    onMutate: async (newGroup) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['groups'] });
      
      // Snapshot previous value
      const previousGroups = queryClient.getQueryData(['groups']);
      
      // Optimistically update with temporary group
      const tempGroup = {
        ...newGroup,
        id: `temp-${Date.now()}`,
        order_index: previousGroups ? previousGroups.length : 0,
        sets: []
      };
      
      if (previousGroups) {
        queryClient.setQueryData(['groups'], [...previousGroups, tempGroup]);
      }
      
      return { previousGroups, tempGroup };
    },
    onSuccess: (data, variables, context) => {
      // Replace temp group with real data
      const previousGroups = queryClient.getQueryData(['groups']);
      if (previousGroups && context?.tempGroup) {
        const updatedGroups = previousGroups.map(g => 
          g.id === context.tempGroup.id ? data : g
        );
        queryClient.setQueryData(['groups'], updatedGroups);
      }
    },
    onError: (err, variables, context) => {
      console.error('Failed to create group:', err);
      // Rollback on error
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups);
      }
    },
  });
};

/**
 * Hook to update a group
 */
export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, updates }) => {
      // Skip database update for temporary groups (not yet created)
      if (groupId.toString().startsWith('temp-')) {
        return Promise.resolve({ id: groupId, ...updates });
      }
      return updateGroup(groupId, updates);
    },
    // Optimistic update
    onMutate: async ({ groupId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['groups'] });
      
      const previousGroups = queryClient.getQueryData(['groups']);
      
      if (previousGroups) {
        queryClient.setQueryData(['groups'], (old) =>
          old.map((group) =>
            group.id === groupId ? { ...group, ...updates } : group
          )
        );
      }
      
      return { previousGroups, isTempGroup: groupId.toString().startsWith('temp-') };
    },
    onError: (err, variables, context) => {
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups);
      }
    },
    onSettled: (data, error, variables, context) => {
      // Only invalidate queries if it's a real group (not temp)
      if (!context?.isTempGroup) {
        queryClient.invalidateQueries({ queryKey: ['groups'] });
      }
    },
  });
};

/**
 * Hook to delete a group
 */
export const useDeleteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId) => {
      // Skip database delete for temporary groups (not yet created)
      if (groupId.toString().startsWith('temp-')) {
        return Promise.resolve({ id: groupId });
      }
      return deleteGroup(groupId);
    },
    // Optimistic update
    onMutate: async (groupId) => {
      await queryClient.cancelQueries({ queryKey: ['groups'] });
      await queryClient.cancelQueries({ queryKey: ['sets'] });
      
      const previousGroups = queryClient.getQueryData(['groups']);
      const previousSets = queryClient.getQueryData(['sets']);
      
      if (previousGroups) {
        queryClient.setQueryData(['groups'], (old) =>
          old.filter((group) => group.id !== groupId)
        );
      }
      
      if (previousSets) {
        queryClient.setQueryData(['sets'], (old) =>
          old.filter((set) => set.group_id !== groupId)
        );
      }
      
      return { previousGroups, previousSets, isTempGroup: groupId.toString().startsWith('temp-') };
    },
    onError: (err, variables, context) => {
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups);
      }
      if (context?.previousSets) {
        queryClient.setQueryData(['sets'], context.previousSets);
      }
    },
    onSettled: (data, error, variables, context) => {
      // Only invalidate queries if it's a real group (not temp)
      if (!context?.isTempGroup) {
        queryClient.invalidateQueries({ queryKey: ['groups'] });
        queryClient.invalidateQueries({ queryKey: ['sets'] });
      }
    },
  });
};

/**
 * Hook to fetch all sets
 */
export const useSets = () => {
  return useQuery({
    queryKey: ['sets'],
    queryFn: fetchSets,
    staleTime: 0, // Always consider data stale for immediate refetch on invalidation
  });
};

/**
 * Hook to create a new set
 */
export const useCreateSet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (setData) => {
      // Ensure the data is serializable before passing to createSet
      const cleanData = {
        group_id: setData.group_id,
        name: setData.name,
        source_language: setData.source_language,
        target_language: setData.target_language
      };
      console.log('🧹 Clean set data for mutation:', cleanData);
      return createSet(cleanData);
    },
    onSuccess: (data, variables) => {
      // Immediately add the new set to the cache
      const previousSets = queryClient.getQueryData(['sets']);
      const previousGroups = queryClient.getQueryData(['groups']);
      
      // Add to sets cache
      if (previousSets) {
        queryClient.setQueryData(['sets'], [...previousSets, data]);
      }
      
      // Add to group's sets array in cache
      if (previousGroups && variables.group_id) {
        queryClient.setQueryData(['groups'], 
          previousGroups.map(g => 
            g.id === variables.group_id 
              ? { ...g, sets: [...(g.sets || []), data] }
              : g
          )
        );
      }
    },
    onError: (err) => {
      console.error('Failed to create set:', err);
      console.error('Error details:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint
      });
    },
  });
};

/**
 * Hook to update a set
 */
export const useUpdateSet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ setId, updates }) => {
      // Skip database update for temporary sets (not yet created)
      if (setId.toString().startsWith('temp-')) {
        return Promise.resolve({ id: setId, ...updates });
      }
      return updateSet(setId, updates);
    },
    // Optimistic update
    onMutate: async ({ setId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['sets'] });
      
      const previousSets = queryClient.getQueryData(['sets']);
      
      if (previousSets) {
        queryClient.setQueryData(['sets'], (old) =>
          old.map((set) =>
            set.id === setId ? { ...set, ...updates } : set
          )
        );
      }
      
      return { previousSets, isTempSet: setId.toString().startsWith('temp-') };
    },
    onError: (err, variables, context) => {
      if (context?.previousSets) {
        queryClient.setQueryData(['sets'], context.previousSets);
      }
    },
    onSettled: (data, error, variables, context) => {
      // Only invalidate queries if it's a real set (not temp)
      if (!context?.isTempSet) {
        queryClient.invalidateQueries({ queryKey: ['sets'] });
      }
    },
  });
};

/**
 * Hook to delete a set
 */
export const useDeleteSet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (setId) => {
      // Skip database delete for temporary sets (not yet created)
      if (setId.toString().startsWith('temp-')) {
        return Promise.resolve({ id: setId });
      }
      return deleteSet(setId);
    },
    // Optimistic update
    onMutate: async (setId) => {
      await queryClient.cancelQueries({ queryKey: ['sets'] });
      
      const previousSets = queryClient.getQueryData(['sets']);
      
      if (previousSets) {
        queryClient.setQueryData(['sets'], (old) =>
          old.filter((set) => set.id !== setId)
        );
      }
      
      return { previousSets, isTempSet: setId.toString().startsWith('temp-') };
    },
    onError: (err, variables, context) => {
      if (context?.previousSets) {
        queryClient.setQueryData(['sets'], context.previousSets);
      }
    },
    onSettled: (data, error, variables, context) => {
      // Only invalidate queries if it's a real set (not temp)
      if (!context?.isTempSet) {
        queryClient.invalidateQueries({ queryKey: ['sets'] });
        queryClient.invalidateQueries({ queryKey: ['words'] });
      }
    },
  });
};

/**
 * Hook to fetch words for a specific set
 */
export const useWords = (setId) => {
  return useQuery({
    queryKey: ['words', setId],
    queryFn: () => fetchWordsBySet(setId),
    enabled: !!setId, // Only fetch if setId is provided
  });
};

/**
 * Hook to create a new word
 */
export const useCreateWord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWord,
    // Optimistic update
    onMutate: async (newWord) => {
      const setId = newWord.set_id;
      await queryClient.cancelQueries({ queryKey: ['words', setId] });
      await queryClient.cancelQueries({ queryKey: ['sets'] });
      
      const previousWords = queryClient.getQueryData(['words', setId]);
      const previousSets = queryClient.getQueryData(['sets']);
      
      // Optimistically add word
      if (previousWords) {
        queryClient.setQueryData(['words', setId], (old) => [
          ...old,
          { ...newWord, id: 'temp-' + Date.now() }
        ]);
      }
      
      // Optimistically increment word_count in sets
      if (previousSets) {
        queryClient.setQueryData(['sets'], (old) =>
          old.map((set) =>
            set.id === setId 
              ? { ...set, word_count: (set.word_count || 0) + 1 }
              : set
          )
        );
      }
      
      return { previousWords, previousSets, setId };
    },
    onSuccess: (data, variables) => {
      const setId = variables.set_id;
      
      // Update words cache with real data
      const currentWords = queryClient.getQueryData(['words', setId]);
      if (currentWords) {
        // Replace temp word with real word
        queryClient.setQueryData(['words', setId], (old) =>
          old.map((word) => 
            word.id && word.id.toString().startsWith('temp-') ? data : word
          ).filter((word, index, self) => 
            // Remove duplicates based on word ID
            index === self.findIndex((w) => w.id === word.id)
          )
        );
      } else {
        // Initialize cache if it doesn't exist
        queryClient.setQueryData(['words', setId], [data]);
      }
      
      // Update word count in sets
      const currentSets = queryClient.getQueryData(['sets']);
      if (currentSets) {
        queryClient.setQueryData(['sets'], (old) =>
          old.map((set) =>
            set.id === setId 
              ? { ...set, word_count: (set.word_count || 0) }
              : set
          )
        );
      }
    },
    onError: (err, newWord, context) => {
      if (context?.previousWords) {
        queryClient.setQueryData(['words', context.setId], context.previousWords);
      }
      if (context?.previousSets) {
        queryClient.setQueryData(['sets'], context.previousSets);
      }
    },
  });
};

/**
 * Hook to update a word
 */
export const useUpdateWord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ wordId, updates }) => updateWord(wordId, updates),
    // Optimistic update
    onMutate: async ({ wordId, updates, setId }) => {
      await queryClient.cancelQueries({ queryKey: ['words', setId] });
      
      const previousWords = queryClient.getQueryData(['words', setId]);
      
      if (previousWords) {
        queryClient.setQueryData(['words', setId], (old) =>
          old.map((word) =>
            word.id === wordId ? { ...word, ...updates } : word
          )
        );
      }
      
      return { previousWords, setId };
    },
    onError: (err, variables, context) => {
      if (context?.previousWords) {
        queryClient.setQueryData(['words', context.setId], context.previousWords);
      }
    },
    onSettled: (data, error, variables, context) => {
      // Refetch to ensure data is in sync with database
      if (context?.setId) {
        queryClient.invalidateQueries({ queryKey: ['words', context.setId] });
      }
    },
  });
};

/**
 * Hook to delete a word
 */
export const useDeleteWord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ wordId }) => deleteWord(wordId),
    // Optimistic update
    onMutate: async ({ wordId, setId }) => {
      await queryClient.cancelQueries({ queryKey: ['words', setId] });
      await queryClient.cancelQueries({ queryKey: ['sets'] });
      
      const previousWords = queryClient.getQueryData(['words', setId]);
      const previousSets = queryClient.getQueryData(['sets']);
      
      // Optimistically remove word
      if (previousWords) {
        queryClient.setQueryData(['words', setId], (old) =>
          old.filter((word) => word.id !== wordId)
        );
      }
      
      // Optimistically decrement word_count in sets
      if (previousSets) {
        queryClient.setQueryData(['sets'], (old) =>
          old.map((set) =>
            set.id === setId 
              ? { ...set, word_count: Math.max((set.word_count || 1) - 1, 0) }
              : set
          )
        );
      }
      
      return { previousWords, previousSets, setId };
    },
    onError: (err, variables, context) => {
      if (context?.previousWords) {
        queryClient.setQueryData(['words', context.setId], context.previousWords);
      }
      if (context?.previousSets) {
        queryClient.setQueryData(['sets'], context.previousSets);
      }
    },
    // No onSettled - rely on optimistic updates for instant UI
  });
};
