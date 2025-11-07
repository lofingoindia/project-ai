# How to Add Gemini API Key to Supabase Edge Function

## Your Gemini API Key
```
AIzaSyDQ_IImJ2MNZ-IgI9dm35PZwXWDEFBW76g
```

## Steps to Configure Supabase Edge Function Secret

### Option 1: Using Supabase Dashboard (Easiest)
1. Go to https://supabase.com/dashboard
2. Select your project: `jspzneczpbvyclycoelb`
3. Navigate to **Edge Functions** in the left sidebar
4. Click on your function: **bright-service**
5. Go to the **Secrets** or **Settings** tab
6. Click **Add Secret** or **New Secret**
7. Add:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyDQ_IImJ2MNZ-IgI9dm35PZwXWDEFBW76g`
8. Click **Save**
9. **Redeploy** the function (there should be a Deploy or Redeploy button)

### Option 2: Using Supabase CLI (If you have it installed)
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref jspzneczpbvyclycoelb

# Set the secret
supabase secrets set GEMINI_API_KEY=AIzaSyDQ_IImJ2MNZ-IgI9dm35PZwXWDEFBW76g

# Redeploy the function
supabase functions deploy bright-service
```

## After Adding the Secret

1. The Edge Function will be able to access it via: `Deno.env.get('GEMINI_API_KEY')`
2. Test the app again - the error should be resolved
3. The image generation should work

## Verify It's Working
After adding the secret and redeploying:
1. Open your Flutter app
2. Try generating a personalized book cover
3. Check the Supabase Edge Function logs for success messages

## Important Notes
- The secret must be named exactly `GEMINI_API_KEY` (case-sensitive)
- You must redeploy the function after adding secrets
- Secrets are environment variables that persist across deployments
