# Debug Notification System

## Step 1: Check Resend API Key
```bash
# In your terminal, check if the key is set:
echo $RESEND_API_KEY
# Should show: re_xxxxxxxxxxxx

# Or check the file:
grep RESEND_API_KEY .env.local
```

## Step 2: Check Your User ID and Project Ownership
1. Open browser console
2. Go to your project page
3. Run:
```javascript
fetch('/api/profile')
  .then(r => r.json())
  .then(d => console.log('My User ID:', d.data.id))

// Then check project owners:
fetch('/api/projects/YOUR_PROJECT_ID')
  .then(r => r.json())
  .then(d => console.log('Project Owners:', d.data.owner_ids))
```

## Step 3: Check Notification Preferences
1. Open Settings modal (gear icon)
2. Check if "New feature suggestions on my projects" is enabled
3. Or in console:
```javascript
fetch('/api/profile')
  .then(r => r.json())
  .then(d => console.log('Prefs:', d.data.notification_preferences))
```

## Step 4: Test Email Sending Directly

The issue is likely one of:
- ✅ **Expected behavior**: You created a suggestion on your own project (won't notify yourself)
- ❌ **Missing API key**: RESEND_API_KEY not set or dev server not restarted
- ❌ **Wrong environment**: Using production Supabase but local .env.local

## Proper Test Scenario

To actually receive an email:
1. You need to be a project OWNER
2. ANOTHER user creates the feature suggestion
3. Your notification preference must be enabled

**Quick workaround for testing:**
- Create a project with your account
- Create a second test account
- Log in as the second account
- Create a feature suggestion on the first account's project
- Check the first account's email
