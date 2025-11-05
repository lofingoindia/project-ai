# Vertex AI Setup Guide

## 1. Install Dependencies
```bash
pip install flask google-cloud-aiplatform requests vertexai
```

## 2. Set Environment Variables
```bash
# Set your Google Cloud Project ID
export GOOGLE_CLOUD_PROJECT_ID="your-actual-project-id"

# Set up Google Cloud Authentication
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
```

## 3. Enable APIs in Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable these APIs:
   - Vertex AI API
   - Cloud AI Platform API

## 4. Create Service Account (if needed)
1. Go to IAM & Admin > Service Accounts
2. Create a new service account
3. Grant roles:
   - Vertex AI User
   - AI Platform Developer
4. Download the JSON key file

## 5. Test the Setup
Run the test script:
```bash
python test_cover_image.py
```

## 6. Deploy to VPS
1. Upload the updated `app.py`
2. Install dependencies: `pip install -r requirements_vertex_ai.txt`
3. Set environment variables on your VPS
4. Restart your Flask app

## Benefits of Vertex AI over Gemini
- ✅ Specifically designed for image editing
- ✅ Better face swapping capabilities
- ✅ More precise control with guidance_scale
- ✅ Handles image modifications more accurately
- ✅ Direct file-based approach (like editimage.py)
