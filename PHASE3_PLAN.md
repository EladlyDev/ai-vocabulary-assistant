# Phase 3: AI Engine & Backend Integration

**Branch:** `phase3-backend-integration`

**Goal:** Replace mock data with real backend, persistent database, and AI integration.

---

## Overview

Transform the application from a client-side prototype into a dynamic, multi-user tool with:
- Real backend with persistent storage
- User authentication and authorization
- AI-powered vocabulary features
- Serverless functions for AI processing

---

## Step 1: Backend & Database Setup ✓

### Platform: Supabase
- **Why Supabase?** Open-source Firebase alternative with PostgreSQL
- **Features:** Database, Authentication, Serverless Functions, Real-time subscriptions

### Database Schema

#### Table: `users`
Handled by Supabase Auth automatically.

#### Table: `groups`
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for faster queries
CREATE INDEX idx_groups_user_id ON groups(user_id);
CREATE INDEX idx_groups_position ON groups(user_id, position);
```

#### Table: `sets`
```sql
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for faster queries
CREATE INDEX idx_sets_group_id ON sets(group_id);
CREATE INDEX idx_sets_user_id ON sets(user_id);
CREATE INDEX idx_sets_position ON sets(group_id, position);
```

#### Table: `words`
```sql
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id UUID REFERENCES sets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  definition TEXT,
  example TEXT,
  synonyms TEXT[], -- Array of synonyms
  antonyms TEXT[], -- Array of antonyms
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for faster queries
CREATE INDEX idx_words_set_id ON words(set_id);
CREATE INDEX idx_words_user_id ON words(user_id);
CREATE INDEX idx_words_position ON words(set_id, position);
```

### Row Level Security (RLS) Policies

#### Groups RLS
```sql
-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Users can view their own groups
CREATE POLICY "Users can view own groups" ON groups
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own groups
CREATE POLICY "Users can insert own groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own groups
CREATE POLICY "Users can update own groups" ON groups
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own groups
CREATE POLICY "Users can delete own groups" ON groups
  FOR DELETE USING (auth.uid() = user_id);
```

#### Sets RLS
```sql
-- Enable RLS
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

-- Users can view their own sets
CREATE POLICY "Users can view own sets" ON sets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sets
CREATE POLICY "Users can insert own sets" ON sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sets
CREATE POLICY "Users can update own sets" ON sets
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own sets
CREATE POLICY "Users can delete own sets" ON sets
  FOR DELETE USING (auth.uid() = user_id);
```

#### Words RLS
```sql
-- Enable RLS
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- Users can view their own words
CREATE POLICY "Users can view own words" ON words
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own words
CREATE POLICY "Users can insert own words" ON words
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own words
CREATE POLICY "Users can update own words" ON words
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own words
CREATE POLICY "Users can delete own words" ON words
  FOR DELETE USING (auth.uid() = user_id);
```

---

## Step 2: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

---

## Step 3: Environment Setup

Create `.env.local` file:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Add to `.gitignore`:
```
.env.local
```

---

## Step 4: Supabase Client Configuration

Create `src/lib/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Step 5: Authentication Implementation

- [ ] Create login/signup pages
- [ ] Implement authentication context
- [ ] Add protected routes
- [ ] Session management

---

## Step 6: Replace Mock Data with Real Database Calls

- [ ] Replace `groups` state with Supabase queries
- [ ] Replace `sets` state with Supabase queries
- [ ] Replace `words` state with Supabase queries
- [ ] Implement real-time subscriptions (optional)

---

## Step 7: AI Integration

### API Options:
1. **OpenAI GPT-4** - Best for natural language understanding
2. **Anthropic Claude** - Excellent for definitions and examples
3. **Google Gemini** - Good balance of cost and performance

### Supabase Edge Functions

Create serverless functions for:
- [ ] Generate word definitions
- [ ] Generate example sentences
- [ ] Find synonyms/antonyms
- [ ] Bulk word processing
- [ ] Context-aware suggestions

---

## Step 8: Testing & Optimization

- [ ] Test authentication flows
- [ ] Test CRUD operations
- [ ] Test AI features
- [ ] Optimize database queries
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success notifications

---

## Step 9: Deployment

- [ ] Deploy to Vercel/Netlify
- [ ] Configure environment variables
- [ ] Test in production
- [ ] Monitor performance

---

## Notes

- Keep the existing UI/UX intact
- Maintain responsive design
- Add loading indicators for async operations
- Implement proper error handling
- Consider rate limiting for AI calls
- Add cost monitoring for AI API usage

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [React Query for Data Fetching](https://tanstack.com/query/latest)
