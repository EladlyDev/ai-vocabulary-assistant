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
    onSuccess: async (data) => {
      // Force immediate refetch of groups
      await queryClient.refetchQueries({ queryKey: ['groups'] });
    },
    onError: (err) => {
      console.error('Failed to create group:', err);
    },
  });
};

/**
 * Hook to update a group
 */
export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, updates }) => updateGroup(groupId, updates),
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
      
      return { previousGroups };
    },
    onError: (err, variables, context) => {
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

/**
 * Hook to delete a group
 */
export const useDeleteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroup,
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
      
      return { previousGroups, previousSets };
    },
    onError: (err, variables, context) => {
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups);
      }
      if (context?.previousSets) {
        queryClient.setQueryData(['sets'], context.previousSets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['sets'] });
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
  });
};

/**
 * Hook to create a new set
 */
export const useCreateSet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSet,
    onSuccess: async (data) => {
      // Force immediate refetch of sets
      await queryClient.refetchQueries({ queryKey: ['sets'] });
    },
    onError: (err) => {
      console.error('Failed to create set:', err);
    },
  });
};

/**
 * Hook to update a set
 */
export const useUpdateSet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ setId, updates }) => updateSet(setId, updates),
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
      
      return { previousSets };
    },
    onError: (err, variables, context) => {
      if (context?.previousSets) {
        queryClient.setQueryData(['sets'], context.previousSets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sets'] });
    },
  });
};

/**
 * Hook to delete a set
 */
export const useDeleteSet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSet,
    // Optimistic update
    onMutate: async (setId) => {
      await queryClient.cancelQueries({ queryKey: ['sets'] });
      
      const previousSets = queryClient.getQueryData(['sets']);
      
      if (previousSets) {
        queryClient.setQueryData(['sets'], (old) =>
          old.filter((set) => set.id !== setId)
        );
      }
      
      return { previousSets };
    },
    onError: (err, variables, context) => {
      if (context?.previousSets) {
        queryClient.setQueryData(['sets'], context.previousSets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sets'] });
      queryClient.invalidateQueries({ queryKey: ['words'] });
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
    onError: (err, newWord, context) => {
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
    // No onSettled - rely on optimistic updates for instant UI
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
