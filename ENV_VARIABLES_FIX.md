# Environment Variables Fix

## Issue
Blank page on `http://localhost:3000` - Application not loading

## Root Cause
Used `VITE_` prefix for environment variables, but this project uses **Create React App**, not Vite.

## Solution

### Environment Variable Naming Convention

**Create React App** requires: `REACT_APP_` prefix
**Vite** requires: `VITE_` prefix

### Changes Made

#### 1. Updated `.env.local`:
```bash
# BEFORE (Incorrect ❌)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GOOGLE_AI_API_KEY=...

# AFTER (Correct ✅)
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
REACT_APP_GOOGLE_AI_API_KEY=...
```

#### 2. Updated `src/lib/supabase.js`:
```javascript
// BEFORE (Incorrect ❌)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// AFTER (Correct ✅)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
```

## How to Apply

1. ✅ Environment variables updated
2. ✅ Supabase client updated
3. 🔄 **MUST restart development server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm start
   ```

## Important Notes

- **Environment variables are loaded at build time** in Create React App
- **Must restart server** after changing `.env.local`
- All env vars must start with `REACT_APP_` to be accessible in the browser
- Never commit `.env.local` to git (already in `.gitignore`)

## Testing

After restart, you should see:
1. **Login page** at `http://localhost:3000/login`
2. **Signup page** at `http://localhost:3000/signup`
3. **Redirect to login** when accessing root `/` (because not authenticated)

## Next Steps

Once server restarts successfully:
1. Test login/signup flow
2. Verify Supabase connection
3. Continue to Phase 3B: Database Integration

---

**Current Status:** Ready for testing after server restart
