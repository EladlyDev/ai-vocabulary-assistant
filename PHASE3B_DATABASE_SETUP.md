# Phase 3B: Database Setup Guide

## Step 1: Access Supabase SQL Editor

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project: **qrdegshfsmykdewlxwvv**
4. Click on **SQL Editor** in the left sidebar
5. Click **New Query**

---

## Step 2: Create Tables

Copy and paste this entire script into the SQL Editor and click **Run**:

```sql
-- ============================================
-- AI Vocabulary Assistant - Database Schema
-- Phase 3B: Database Integration
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE 1: Groups
-- ============================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for groups
CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_display_order ON groups(user_id, display_order);

-- ============================================
-- TABLE 2: Sets
-- ============================================
CREATE TABLE IF NOT EXISTS sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for sets
CREATE INDEX IF NOT EXISTS idx_sets_user_id ON sets(user_id);
CREATE INDEX IF NOT EXISTS idx_sets_group_id ON sets(group_id);

-- ============================================
-- TABLE 3: Words
-- ============================================
CREATE TABLE IF NOT EXISTS words (
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

-- Indexes for words
CREATE INDEX IF NOT EXISTS idx_words_user_id ON words(user_id);
CREATE INDEX IF NOT EXISTS idx_words_set_id ON words(set_id);
CREATE INDEX IF NOT EXISTS idx_words_display_order ON words(set_id, display_order);

-- ============================================
-- Success Message
-- ============================================
SELECT 'Tables created successfully!' AS message;
```

**Expected Result:** You should see "Tables created successfully!" message.

---

## Step 3: Enable Row Level Security

Copy and paste this script and click **Run**:

```sql
-- ============================================
-- Enable Row Level Security on all tables
-- ============================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

SELECT 'RLS enabled on all tables!' AS message;
```

---

## Step 4: Create RLS Policies for Groups

Copy and paste this script and click **Run**:

```sql
-- ============================================
-- RLS Policies for Groups Table
-- ============================================

-- Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Users can view own groups" ON groups;
DROP POLICY IF EXISTS "Users can insert own groups" ON groups;
DROP POLICY IF EXISTS "Users can update own groups" ON groups;
DROP POLICY IF EXISTS "Users can delete own groups" ON groups;

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

SELECT 'Groups RLS policies created!' AS message;
```

---

## Step 5: Create RLS Policies for Sets

Copy and paste this script and click **Run**:

```sql
-- ============================================
-- RLS Policies for Sets Table
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own sets" ON sets;
DROP POLICY IF EXISTS "Users can insert own sets" ON sets;
DROP POLICY IF EXISTS "Users can update own sets" ON sets;
DROP POLICY IF EXISTS "Users can delete own sets" ON sets;

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

SELECT 'Sets RLS policies created!' AS message;
```

---

## Step 6: Create RLS Policies for Words

Copy and paste this script and click **Run**:

```sql
-- ============================================
-- RLS Policies for Words Table
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own words" ON words;
DROP POLICY IF EXISTS "Users can insert own words" ON words;
DROP POLICY IF EXISTS "Users can update own words" ON words;
DROP POLICY IF EXISTS "Users can delete own words" ON words;

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

SELECT 'Words RLS policies created!' AS message;
```

---

## Step 7: Verify Setup

Copy and paste this verification script and click **Run**:

```sql
-- ============================================
-- Verification Script
-- ============================================

-- Check tables exist
SELECT 
  'Tables' AS check_type,
  COUNT(*) AS count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('groups', 'sets', 'words');

-- Check RLS is enabled
SELECT 
  'RLS Enabled' AS check_type,
  COUNT(*) AS count
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('groups', 'sets', 'words')
  AND rowsecurity = true;

-- Check policies exist
SELECT 
  'Policies' AS check_type,
  COUNT(*) AS count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'sets', 'words');

-- List all policies
SELECT 
  tablename,
  policyname,
  cmd AS command
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'sets', 'words')
ORDER BY tablename, policyname;
```

**Expected Results:**
- Tables count: 3
- RLS Enabled count: 3
- Policies count: 12 (4 per table)
- Policy list showing all 12 policies

---

## Step 8: Optional - Insert Demo Data

If you want to test with demo data, copy and paste this script:

```sql
-- ============================================
-- Demo Data (Optional)
-- ============================================

-- Note: Replace 'YOUR_USER_ID' with your actual user ID
-- You can get your user ID by running: SELECT auth.uid();

-- Insert demo group
INSERT INTO groups (user_id, name, color, display_order) 
VALUES 
  (auth.uid(), 'My First Group', 'blue', 0)
RETURNING *;

-- Note: After running above, copy the group ID and use it below
-- Replace 'GROUP_ID_HERE' with the actual UUID

-- Insert demo set
INSERT INTO sets (user_id, group_id, name)
VALUES
  (auth.uid(), 'GROUP_ID_HERE', 'English → Arabic Basics')
RETURNING *;

-- Note: Copy the set ID and use it below
-- Replace 'SET_ID_HERE' with the actual UUID

-- Insert demo words
INSERT INTO words (user_id, set_id, word, translation, sentence, sentence_translation, display_order)
VALUES
  (auth.uid(), 'SET_ID_HERE', 'hello', 'مرحبا', 'Hello, how are you?', 'مرحبا، كيف حالك؟', 0),
  (auth.uid(), 'SET_ID_HERE', 'thank you', 'شكرا', 'Thank you very much.', 'شكرا جزيلا.', 1),
  (auth.uid(), 'SET_ID_HERE', 'goodbye', 'وداعا', 'Goodbye, see you later.', 'وداعا، أراك لاحقا.', 2)
RETURNING *;
```

---

## Step 9: View Your Tables

1. In Supabase, click **Table Editor** in the left sidebar
2. You should see three new tables:
   - `groups`
   - `sets`
   - `words`
3. Click on each to view their structure and data

---

## Step 10: Test RLS Policies

Try this query to verify RLS is working:

```sql
-- This should only return YOUR groups
SELECT * FROM groups;

-- This should only return YOUR sets
SELECT * FROM sets;

-- This should only return YOUR words
SELECT * FROM words;
```

If you see any data, it should only be data associated with your user ID.

---

## Troubleshooting

### Problem: "relation does not exist"
**Solution:** Make sure you ran Step 2 (Create Tables) successfully.

### Problem: "permission denied"
**Solution:** RLS policies are working! You can only access your own data.

### Problem: Tables don't show in Table Editor
**Solution:** Refresh the page or click on another tab and come back.

### Problem: Can't insert data
**Solution:** Make sure you're logged in. Run `SELECT auth.uid();` to verify.

---

## Next Steps

Once database setup is complete, return to the code and we'll:
1. Create database service layer
2. Set up React Query
3. Replace mock data with real database calls

---

**Database setup complete! Ready for code integration.**
