# Vertex AI Imagen Setup Guide for Face Swapping

Based on the [official Vertex AI Imagen API documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/imagen-api), here's how to set up proper face editing.

## 1. Install Dependencies
```bash
pip install flask google-cloud-aiplatform>=1.38.0 requests google-cloud-storage
```

## 2. Set Environment Variables
```bash
# Set your Google Cloud Project ID (REQUIRED)
export GOOGLE_CLOUD_PROJECT_ID="your-actual-project-id"

# Set up Google Cloud Authentication (REQUIRED)
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
```

## 3. Enable Required APIs in Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable these APIs:
   - **Vertex AI API**
   - **AI Platform API** 
   - **Cloud Storage API**sdfdfgfghhj

## 4. Create Service Account
1. Go to **IAM & Admin > Service Accounts**
2. Create a new service account
3. Grant these roles:
   - `Vertex AI User`
   - `AI Platform Developer`
   - `Storage Object Viewer` (if using Cloud Storage)
4. Download the JSON key file
5. Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of this file

## 5. Key Differences from Previous Approach

### ✅ Using Imagen Model Specifically for Editing:
```python
# Load the Imagen model for editing (not general generation)
model = ImageGenerationModel.from_pretrained("imagegeneration@002")

# Use edit_image method with advanced parameters
images = model.edit_image(
    base_image=base_img,
    prompt=enhanced_prompt,
    edit_mode="inpainting-insert",  # For face replacement
    mask_mode="semantic",  # Automatically detect face region  
    guidance_scale=20,  # High guidance for precise editing
    number_of_images=1,
)
```

### ✅ Enhanced Prompting for Face Swapping:
```python
enhanced_prompt = f"""Edit this image by replacing the child's face with the face from the reference image. {prompt} Keep everything else exactly the same - same background, same pose, same clothing, same lighting. Only change the face to match the reference child's face perfectly. Make it look completely natural and realistic."""
```

## 6. Test the Setup

### Option A: Test with Python Script
```bash
python test_cover_image.py
```

### Option B: Test with curl
```bash
curl -X POST http://72.60.193.120:5000/api/face-swap \
  -H "Content-Type: application/json" \
  -d '{
    "cover_image_url": "https://your-cover-image-url",
    "child_image_url": "https://your-child-image-url", 
    "prompt": "Replace the child face with the reference face",
    "user_id": "test-123",
    "book_id": "book-456",
    "child_name": "TestChild"
  }'
```

## 7. Why Imagen API is Better for Face Editing

✅ **Purpose-Built**: Imagen is specifically designed for image editing and manipulation  
✅ **Face Detection**: Built-in semantic masking can automatically detect face regions  
✅ **Inpainting**: Advanced inpainting capabilities for precise face replacement  
✅ **High Fidelity**: Better quality results for face swapping tasks  
✅ **Control**: More fine-grained control with edit_mode and mask_mode parameters

## 8. Troubleshooting

### Common Issues:
1. **"Project ID not configured"**: Set `GOOGLE_CLOUD_PROJECT_ID` environment variable
2. **"Authentication failed"**: Set `GOOGLE_APPLICATION_CREDENTIALS` to your JSON key file
3. **"API not enabled"**: Enable Vertex AI API in Google Cloud Console
4. **"Permission denied"**: Ensure service account has proper roles

### Debug Logs:
The updated `app.py` includes comprehensive logging to help identify issues:
- `🚀 Face swap API called`
- `⬇️ Downloading images to temporary files...`
- `🎨 Editing image with Vertex AI Imagen API...`
- `✅ Image edited successfully`
