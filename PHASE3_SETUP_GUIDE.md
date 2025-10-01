# Phase 3 Setup Guide: Backend & AI Integration

## 🎯 Current Status
- ✅ Branch created: `phase3-backend-integration`
- 📍 Starting Point: Fully functional frontend with mock data
- 🎯 Goal: Transform into a production-ready, multi-user application

---

## 📋 Pre-Setup Checklist

Before we begin coding, you need to set up the following services:

### 1. Supabase Account & Project Setup

**Steps:**
1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in:
   - **Project Name:** `ai-vocabulary-assistant`
   - **Database Password:** (save this securely)
   - **Region:** Choose closest to your users
4. Wait for project to be created (~2 minutes)

**Get Your Credentials:**
1. Go to Project Settings → API
2. Copy these values (we'll need them):
   - **Project URL:** `https://xxxxx.supabase.co`
   - **Anon/Public Key:** `eyJhbGc...` (long string)

---

### 2. Set Up Database Schema

Once your Supabase project is ready:

**Option A: Using SQL Editor (Recommended)**
1. Go to SQL Editor in Supabase Dashboard
2. Click "New Query"
3. Copy the entire SQL script from `PHASE3_PLAN.md` (tables + RLS policies)
4. Click "Run" to execute

**Option B: Manual Table Creation**
1. Go to Table Editor
2. Create tables one by one following the schema

---

### 3. AI Service Selection

Choose your AI provider (we'll start with one, can add more later):

#### Option 1: OpenAI (Recommended for quality)
- Sign up at [platform.openai.com](https://platform.openai.com)
- Add billing method (pay-as-you-go)
- Generate API key from API keys section
- **Cost:** ~$0.002 per word processed (very affordable)

#### Option 2: Google Gemini (Good free tier)
- Go to [ai.google.dev](https://ai.google.dev)
- Get free API key (60 requests/minute)
- **Cost:** Free tier available

#### Option 3: Anthropic Claude
- Sign up at [anthropic.com](https://www.anthropic.com)
- Similar pricing to OpenAI
- Excellent for context-aware generations

---

### 4. Google Custom Search API (for images)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable "Custom Search API"
4. Create credentials (API Key)
5. Set up Custom Search Engine:
   - Go to [Custom Search Engine](https://cse.google.com)
   - Create new search engine
   - Enable "Image Search"
   - Get your Search Engine ID

**Limits:** 100 queries/day free, then $5 per 1000 queries

---

### 5. Text-to-Speech Service

#### Option 1: Google Cloud TTS (Recommended)
- Enable Cloud Text-to-Speech API in Google Cloud Console
- 1 million characters free per month
- Excellent voice quality

#### Option 2: ElevenLabs (Premium quality)
- Sign up at [elevenlabs.io](https://elevenlabs.io)
- Free tier: 10,000 characters/month
- Most natural-sounding voices

#### Option 3: Amazon Polly
- AWS account required
- 5 million characters free (first 12 months)

---

## 🔧 Installation Steps

### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js
npm install @tanstack/react-query  # For data fetching
npm install openai  # If using OpenAI
npm install @google-cloud/text-to-speech  # If using Google TTS
```

### Step 2: Environment Variables

Create `.env.local` in your project root:

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# AI Service (choose one or all)
VITE_OPENAI_API_KEY=sk-xxxxx
VITE_GOOGLE_AI_API_KEY=xxxxx
VITE_ANTHROPIC_API_KEY=xxxxx

# Google Custom Search (for images)
VITE_GOOGLE_SEARCH_API_KEY=xxxxx
VITE_GOOGLE_SEARCH_ENGINE_ID=xxxxx

# Text-to-Speech
VITE_GOOGLE_TTS_API_KEY=xxxxx
# OR
VITE_ELEVENLABS_API_KEY=xxxxx
```

**Important:** Add `.env.local` to `.gitignore`:
```bash
echo ".env.local" >> .gitignore
```

### Step 3: Create Supabase Client

We'll create this file together:
`src/lib/supabase.js`

### Step 4: Create Authentication Context

We'll create:
- `src/contexts/AuthContext.jsx`
- `src/components/Auth/Login.jsx`
- `src/components/Auth/Signup.jsx`

---

## 🗂️ Project Structure (Phase 3)

```
ai-vocabulary-assistant/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.jsx          # NEW
│   │   │   ├── Signup.jsx         # NEW
│   │   │   └── ProtectedRoute.jsx # NEW
│   │   ├── Dashboard.js           # MODIFY: Connect to DB
│   │   ├── SetEditor.js           # MODIFY: Connect to DB
│   │   ├── AIGeneration/          # NEW
│   │   │   ├── SentenceGenerator.jsx
│   │   │   ├── ImageSearch.jsx
│   │   │   └── AudioGenerator.jsx
│   │   └── ...existing components
│   ├── contexts/
│   │   └── AuthContext.jsx        # NEW
│   ├── lib/
│   │   ├── supabase.js           # NEW
│   │   ├── openai.js             # NEW
│   │   └── api/                  # NEW
│   │       ├── groups.js
│   │       ├── sets.js
│   │       └── words.js
│   ├── hooks/
│   │   ├── useAuth.js            # NEW
│   │   ├── useGroups.js          # NEW
│   │   ├── useSets.js            # NEW
│   │   └── useWords.js           # NEW
│   └── App.jsx                   # MODIFY: Add routing & auth
├── .env.local                    # NEW (gitignored)
├── PHASE3_PLAN.md               # Planning doc
└── PHASE3_SETUP_GUIDE.md        # This file
```

---

## 🚀 Implementation Order

We'll implement in this order to maintain a working app at each step:

### Phase 3A: Authentication Foundation
1. Set up Supabase client
2. Create AuthContext
3. Build Login/Signup pages
4. Add protected routes
5. Test authentication flow

### Phase 3B: Database Integration
1. Create API helper functions (groups, sets, words)
2. Create custom hooks (useGroups, useSets, useWords)
3. Replace mock data in Dashboard
4. Replace mock data in SetEditor
5. Test CRUD operations

### Phase 3C: AI Integration - Sentences
1. Set up OpenAI/Gemini client
2. Create sentence generation function
3. Add "Generate with AI" button to SetEditor
4. Add loading states and error handling
5. Test with various words

### Phase 3D: AI Integration - Images
1. Set up Google Custom Search
2. Create image search function
3. Add image carousel/selector
4. Add "Next Image" functionality
5. Test image relevance

### Phase 3E: AI Integration - Audio
1. Set up TTS service
2. Create audio generation function
3. Add audio player to word cards
4. Cache generated audio
5. Test across languages

### Phase 3F: Export Enhancement
1. Update export to include AI-generated content
2. Add format options (Anki, Quizlet, CSV)
3. Test export with full data

### Phase 3G: Polish & Optimization
1. Add loading states everywhere
2. Improve error messages
3. Add success notifications
4. Optimize database queries
5. Add rate limiting for AI calls
6. Performance testing

---

## 💡 Development Tips

### Working with Supabase
- Use the Supabase Dashboard to test queries directly
- Check Row Level Security policies if data isn't showing
- Use `supabase.auth.getSession()` to debug auth issues

### AI Best Practices
- Always include error handling for AI calls
- Cache AI responses when possible
- Show loading indicators (AI calls can take 1-3 seconds)
- Provide fallback content if AI fails
- Consider rate limiting to control costs

### Testing Strategy
1. Test each feature in isolation first
2. Test with real API calls, not mocks
3. Test error scenarios (no internet, API limits, etc.)
4. Test with different languages
5. Monitor costs during development

---

## 📊 Cost Estimation (Monthly)

For a single user creating ~100 words/month:

| Service | Usage | Cost |
|---------|-------|------|
| Supabase | Database + Auth | **Free** (< 500MB) |
| OpenAI GPT-4 | Sentence generation | ~$0.20 |
| Google Custom Search | Image search | **Free** (< 100/day) |
| Google TTS | Audio generation | **Free** (< 1M chars) |
| **Total** | | **< $1/month** |

Very affordable! 🎉

---

## 🎬 Next Steps

**Before I start coding, please confirm:**

1. ✅ Have you created a Supabase project?
2. ✅ Do you have the Supabase URL and Anon Key?
3. ✅ Have you decided which AI service to use? (OpenAI/Gemini/Claude)
4. ✅ Do you want to set up image search now or later?
5. ✅ Do you want to set up TTS now or later?

**Once confirmed, I'll start with:**
- Creating the Supabase client configuration
- Setting up the authentication system
- Creating the database API helpers

Let me know when you're ready! 🚀
