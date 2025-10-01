# Phase 3B: Database Integration Plan

**Branch:** `phase3b-database-integration`  
**Status:** In Progress  
**Date:** October 1, 2025

## Overview

Migrate from in-memory mock data to persistent Supabase PostgreSQL database with Row Level Security (RLS).

## Objectives

1. Create database schema in Supabase
2. Implement Row Level Security policies
3. Replace mock data with real database operations
4. Integrate React Query for data fetching and caching
5. Maintain all existing features and UX

## Database Schema

### Table 1: `groups`
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_groups_user_id ON groups(user_id);
CREATE INDEX idx_groups_display_order ON groups(user_id, display_order);
```

### Table 2: `sets`
```sql
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_sets_user_id ON sets(user_id);
CREATE INDEX idx_sets_group_id ON sets(group_id);
```

### Table 3: `words`
```sql
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id UUID NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  sentence TEXT,
  sentence_translation TEXT,
  image_url TEXT,
  pronunciation TEXT,
  tags TEXT[] DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_words_user_id ON words(user_id);
CREATE INDEX idx_words_set_id ON words(set_id);
CREATE INDEX idx_words_display_order ON words(set_id, display_order);
```

## Row Level Security (RLS) Policies

### Groups Table Policies
```sql
-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Users can view their own groups
CREATE POLICY "Users can view own groups"
  ON groups FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own groups
CREATE POLICY "Users can insert own groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own groups
CREATE POLICY "Users can update own groups"
  ON groups FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own groups
CREATE POLICY "Users can delete own groups"
  ON groups FOR DELETE
  USING (auth.uid() = user_id);
```

### Sets Table Policies
```sql
-- Enable RLS
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

-- Users can view their own sets
CREATE POLICY "Users can view own sets"
  ON sets FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sets
CREATE POLICY "Users can insert own sets"
  ON sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sets
CREATE POLICY "Users can update own sets"
  ON sets FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own sets
CREATE POLICY "Users can delete own sets"
  ON sets FOR DELETE
  USING (auth.uid() = user_id);
```

### Words Table Policies
```sql
-- Enable RLS
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- Users can view their own words
CREATE POLICY "Users can view own words"
  ON words FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own words
CREATE POLICY "Users can insert own words"
  ON words FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own words
CREATE POLICY "Users can update own words"
  ON words FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own words
CREATE POLICY "Users can delete own words"
  ON words FOR DELETE
  USING (auth.uid() = user_id);
```

## Implementation Steps

### Step 1: Database Setup in Supabase (Manual)
- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Run table creation scripts
- [ ] Run RLS policy scripts
- [ ] Verify tables and policies are created
- [ ] Test with sample data

### Step 2: Create Database Service Layer
- [ ] Create `src/services/database.js` with CRUD operations
- [ ] Create `src/services/groups.js` for group operations
- [ ] Create `src/services/sets.js` for set operations
- [ ] Create `src/services/words.js` for word operations

### Step 3: Set Up React Query
- [ ] Create `src/lib/queryClient.js` for React Query configuration
- [ ] Wrap app with `QueryClientProvider` in App.js
- [ ] Create custom hooks for data fetching
- [ ] Implement optimistic updates

### Step 4: Replace Mock Data in MainApp.js
- [ ] Replace `useState` with React Query hooks
- [ ] Update `handleCreateGroup` to use database
- [ ] Update `handleUpdateGroup` to use database
- [ ] Update `handleDeleteGroup` to use database
- [ ] Update `handleCreateNewSet` to use database
- [ ] Update `handleUpdateSet` to use database
- [ ] Update `handleDeleteSet` to use database
- [ ] Update `handleMoveSetToGroup` to use database

### Step 5: Update Components
- [ ] Update Dashboard to fetch from database
- [ ] Update SetEditor to save to database
- [ ] Update SetViewer to fetch from database
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success notifications

### Step 6: Data Migration (Optional)
- [ ] Create migration script to seed demo data
- [ ] Allow users to keep mock data as demo
- [ ] Provide "Start Fresh" option

### Step 7: Testing
- [ ] Test CRUD operations for groups
- [ ] Test CRUD operations for sets
- [ ] Test CRUD operations for words
- [ ] Test RLS policies (try accessing other users' data)
- [ ] Test error scenarios
- [ ] Test offline behavior

## Code Structure

```
src/
├── services/
│   ├── database.js      # Base database utilities
│   ├── groups.js        # Group CRUD operations
│   ├── sets.js          # Set CRUD operations
│   └── words.js         # Word CRUD operations
├── hooks/
│   ├── useGroups.js     # React Query hook for groups
│   ├── useSets.js       # React Query hook for sets
│   └── useWords.js      # React Query hook for words
├── lib/
│   ├── supabase.js      # Already exists
│   └── queryClient.js   # React Query client config
└── MainApp.js           # Update to use database hooks
```

## React Query Hooks Example

```javascript
// src/hooks/useGroups.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGroups, createGroup, updateGroup, deleteGroup } from '../services/groups';

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries(['groups']);
    },
  });
}

// Similar patterns for update and delete
```

## Database Service Example

```javascript
// src/services/groups.js
import { supabase } from '../lib/supabase';

export async function getGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select('*, sets(*)')
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createGroup(groupData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('groups')
    .insert({
      ...groupData,
      user_id: user.id
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Similar patterns for update and delete
```

## Migration Strategy

### Option 1: Fresh Start (Recommended for MVP)
- New users start with empty database
- Can create demo groups/sets manually
- Clean slate, no migration needed

### Option 2: Seed Demo Data
- Create SQL script with demo data
- Run on first login
- Users can delete if not wanted

### Option 3: Full Migration (Future)
- Export current mock data
- Import to user's account
- More complex, implement later

## Success Criteria

- [ ] All groups persist across sessions
- [ ] All sets persist across sessions
- [ ] All words persist across sessions
- [ ] CRUD operations work flawlessly
- [ ] RLS prevents unauthorized access
- [ ] Loading states show during operations
- [ ] Error messages display correctly
- [ ] No data loss during operations
- [ ] Performance is acceptable (< 500ms for queries)
- [ ] All existing features still work

## Breaking Changes

None expected - all UI and features remain the same, just data source changes.

## Rollback Plan

If issues occur:
1. Revert to main branch
2. Mock data still works
3. Database changes don't affect existing deployments

## Timeline Estimate

- Database Setup: 30 minutes
- Service Layer: 1-2 hours
- React Query Integration: 1-2 hours
- MainApp Updates: 2-3 hours
- Testing: 1-2 hours

**Total: 5-9 hours of work**

## Next Steps After Completion

Phase 3B → Phase 3C: AI Sentence Generation with Google Gemini

---

**Ready to start implementation!**
