# Edge Function Setup Instructions

## Current Issue
The Edge Function `bright-service` is calling a Python API that requires a Gemini API key, but the Python server doesn't have it configured.

## Solutions

### Option A: Configure Python API Server (Recommended if you control it)
Add the `GEMINI_API_KEY` environment variable to the Python server at `http://72.60.193.120:5000`

### Option B: Add Gemini API Key to Supabase Edge Function
If the Edge Function should call Gemini directly instead of the Python API:

1. Go to your Supabase Dashboard
2. Navigate to Edge Functions → bright-service
3. Click on "Settings" or "Secrets"
4. Add a new secret:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key from Google AI Studio

### Option C: Use the Current Setup
If the Python API is just a proxy and should work without Gemini key, there might be a different issue with the Python server configuration.

## How to Get Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to either the Python server or Supabase secrets

## Current Edge Function Configuration
- Function name: `bright-service`
- Calls: Python API at `http://72.60.193.120:5000/generate-image`
- The Python API is returning: "Missing Gemini API key"
