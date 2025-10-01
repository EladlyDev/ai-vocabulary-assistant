# Duplicate Email Detection - Technical Explanation

## The Problem: Supabase Anti-Enumeration Security

Supabase implements a security feature to prevent **email enumeration attacks**. This means when you try to sign up with an existing email, Supabase WON'T always return an error (which would confirm the email exists in the database).

## What Supabase Returns

### New User (Legitimate Signup)
```javascript
{
  data: {
    user: {
      id: "abc123...",
      email: "newuser@example.com",
      identities: [
        {
          provider: "email",
          identity_id: "xyz789...",
          // ... other identity data
        }
      ]
    },
    session: null  // null because email confirmation is required
  },
  error: null
}
```

### Existing User (Duplicate Email)
```javascript
{
  data: {
    user: {
      id: "existing-user-id",
      email: "existing@example.com",
      identities: []  // ← EMPTY! This is the key indicator
    },
    session: null
  },
  error: null  // ← No error! Security feature to prevent enumeration
}
```

## The Solution: Check Identities Array

```javascript
const userCreated = data?.user;
const sessionCreated = data?.session;
const userIdentities = data?.user?.identities;

if (userCreated && userIdentities && userIdentities.length === 0) {
  // 🚨 Duplicate email detected!
  setError('This email is already registered. Please log in instead.');
  setLoading(false);
} else if (userCreated && !sessionCreated) {
  // ✅ New user - email confirmation required
  setNeedsEmailConfirmation(true);
  setLoading(false);
} else if (sessionCreated) {
  // ✅ Auto-login (email confirmation disabled)
  setSuccess(true);
  setLoading(false);
}
```

## Why This Works

1. **New users** always have at least one identity (the email provider)
2. **Existing users** (when returned by anti-enumeration) have an empty identities array
3. This allows us to detect duplicates without relying on error messages

## Security Note

This approach respects Supabase's security model while still providing good UX. The user sees a helpful error message without compromising the system's security against enumeration attacks.

## Debugging

Check the browser console for these logs:
```javascript
Signup response: { data, error }
User created: true/false, Session created: true/false, Identities: 0/1
Detected duplicate email (no identities)  // Only shows for duplicates
```

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Enumeration Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#authentication-and-error-messages)
