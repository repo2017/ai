# 📚 Fooocus/Gradio API Reference Documentation

## 🎯 Overview

This document provides complete reference for the **Fooocus/Gradio API** endpoints used by the React Fooocus Inpainter application. The API is accessed via a local Gradio/Fooocus server running at `http://127.0.0.1:7865`.

> **⚠️ IMPORTANT**: This is the standard Fooocus/Gradio API interface. All endpoints are designed for inpainting image generation workflows.

---

## 📍 Base URL Configuration

The client connects to your Focus server via environment variables or localStorage:

```javascript
FOCUS_SERVER_URL = 'http://127.0.0.1:7865' // Default
```

Endpoints are accessed as:
- **Main API**: `${FOCUS_SERVER_URL}/api/predict` (Gradio API endpoint)
- **Upload Endpoint**: `${FOCUS_SERVER_URL}/upload` (File upload storage)
- **Fallback v1**: `${FOCUS_SERVER_URL}/generation/image-inpaint`

---

## 🔌 Core API Endpoints

### 1. Main Inpainting Generation (`/api/predict`)

The primary endpoint for all inpainting operations.

**URL**: `POST /api/predict` (Gradio standard API)  
**Function Index**: Varies by use case (see below)  
**Content-Type**: `application/json`

---

## 📊 Function Index Reference Table

Each function index (`fn_index`) in Gradio/Fooocus represents a specific operation. Below are the key indices used for inpainting:

| fn_index | Name | Purpose | Complexity | Parameters Required |
|----------|------|---------|------------|---------------------|
| **48** | Inpainting (Basic) | Simple inpainting with styles array | ⭐ Easy | `styles[]`, prompt, image paths |
| **60** | Inpainting (Full) | Complete inpainting workflow | ⭐⭐ Medium | Mask models, detection, SAM options |
| **73** | Generation + Inpaint | Combined workflows | ⭐⭐ Advanced | Both generation and inpainting params |

---

## 📦 Endpoint 1: fn_index 48 - Basic Inpainting

### Description
Simple inpainting endpoint that accepts base64 image data and styles configuration. Best for straightforward inpainting tasks.

### Request Payload Structure

```json
{
  "fn_index": 48,
  "data": [
    false,              // Generate Image Grid for Each Batch (checkbox)
    "positive prompt",  // Positive Prompt Textbox ✅ STRING!
    "negative prompt",  // Negative Prompt Textbox ✅ STRING!
    ["Fooocus V2"],     // Selected Styles Array ✅ MUST BE ARRAY!
    "Quality",          // Performance Mode (Radio)
    "1024×1024",       // Aspect Ratio (Radio)
    1,                  // Image Number (Slider - integer)
    "png",              // Output Format ✅ STRING!
    "-1",               // Seed (-1 = random) ✅ STRING!
    false,              // Read wildcards (Checkbox)
    0,                  // Image Sharpness (Slider)
    1.0,                // Guidance Scale (float)
    "None",             // Base Model ✅ STRING!
    "None",             // Refiner Model ✅ STRING!
    0.1                 // Refiner Switch (float)
    // ... up to 67 parameters total for fn_index 60 variant
  ],
  "session_hash": "unique-session-identifier"
}
```

### Input Parameters Explained

| Index | Parameter | Type | Description | Example Values |
|-------|-----------|------|-------------|----------------|
| 0 | `generate_image_grid` | boolean | Generate multiple images grid per batch | `false` (single image) or `true` |
| 1 | `prompt` | string | **REQUIRED** - Text prompt for generation | `"change to swimsuit"` |
| 2 | `negative_prompt` | string | Negative prompts to avoid | `"unrealistic, bad quality"` |
| 3 | `styles` | array[string] | **Must be array!** Style presets | `["Fooocus V2"]`, `["Speed Art"]` |
| 4 | `performance` | string | Performance vs Quality trade-off | `"Quality"`, `"Speed"` |
| 5 | `aspect_ratio` | string | Output image aspect ratio | `"1024×1024"`, `"768×1024"` |
| 6 | `img_num` | integer | Number of images to generate | `1` (single) or `4` (grid) |
| 7 | `format` | string | Output file format | `"png"`, `"jpg"` |
| 8 | `seed` | string/int | Random seed (-1 = random) | `"-1"`, `"123456"` |
| 9 | `read_wildcards` | boolean | Enable wildcard expansion in prompts | `false` |
| 10+ | Additional params | varies | See full API docs for details | - |

### Response Format

**Success (200 OK)**:
```json
[
  {
    "image": {
      "url": "/file/generated.png",      // OR base64 encoded image
      "base64": "data:image/png;base64,iVBOR...",
      "is_final": true
    },
    "name": "/tmp/f0abc123/generated.png"  // File path for download
  }
]
```

**Alternative formats**:
- `{"image": {base64: "...", ...}}`
- `{output_url: "/file/result.png"}`
- Array of image objects directly

---

## 📦 Endpoint 2: fn_index 60 - Full Inpainting Mode

### Description
Comprehensive inpainting endpoint with advanced mask generation and model options. Accepts pre-uploaded file paths (not base64).

### Upload Files First

Before calling the API, upload images to Gradio storage:

```javascript
// Upload source image
const uploadedImage = await uploadToGradio(baseUrl, base64Source, "source.png");

// Upload mask image  
const uploadedMask = await uploadToGradio(baseUrl, base64Mask, "mask.png");

// Results look like:
{
  name: "/tmp/user123/source.png",    // File path from Gradio storage
  data: null,
  is_file: true,
  uploadedUrl: "http://.../source.png"
}
```

### Request Payload Structure

```json
{
  "fn_index": 60,
  "data": [
    false,                              // 0: Generate Image Grid for Each Batch
    "positive prompt",                  // 1: Positive Prompt ✅ STRING!
    "negative prompt",                  // 2: Negative Prompt ✅ STRING!
    ["Fooocus V2"],                     // 3: Selected Styles (ARRAY!)
    "Quality",                          // 4: Performance Mode
    "1024×1024",                        // 5: Aspect Ratio
    1,                                  // 6: Image Number
    "png",                              // 7: Output Format ✅ STRING!
    "-1",                               // 8: Seed ✅ STRING!
    false,                              // 9: Read wildcards (Checkbox)
    0,                                  // 10: Image Sharpness
    1.0,                                // 11: Guidance Scale
    "None",                             // 12: Base Model ✅ STRING!
    "None",                             // 13: Refiner Model ✅ STRING!
    0.1,                                // 14: Refiner Switch

    // ... LoRA Blocks (15-29) - all strings where applicable
    
    // Inpaint Component Settings
    true,                               // 30: Input Image (Checkbox)
    "",                                  // 31: Placeholder textbox
    "Disabled",                         // 32: Upscale Radio ✅ STRING!
    "/tmp/user/source.png",             // 33: Canvas path from upload ✅ STRING!
    ["Left"],                           // 34: Outpaint Directions (array)
    "/tmp/user/source.png",             // 35: Inpaint Input Source ✅ STRING!
    "positive prompt",                  // 36: Additional Prompt ✅ STRING!
    "/tmp/user/mask.png",               // 37: Mask Upload Target ✅ STRING!
    
    // Advanced settings (38-60)
    false,                              // 38: Disable Preview (checkbox)
    true,                               // 39: Enable Advanced Masking
    true,                               // 40: Disable Intermediate Results
    false,                              // 41: Disable seed increment
    false,                              // 42: Black Out NSFW
    1.5,                                // 43: Positive ADM Guidance Scaler
    0.8,                                // 44: Negative ADM Guidance Scaler
    0.3,                                // 45: ADM Guidance End At Step
    7,                                  // 46: CFG Mimicking from TSNR
    2,                                  // 47: CLIP Skip
    
    // Sampling Options (48-50)
    "dpmpp_2m_sde_gpu",                 // 48: Sampler ✅ STRING!
    "karras",                           // 49: Scheduler ✅ STRING!
    "Default (model)",                  // 50: VAE ✅ STRING!
    
    // Forced Overwrites (51-54) - all "-1"
    "-1",                               // 51: Force Sample Step Override
    "-1",                               // 52: Force Refiner Step Override
    "-1",                               // 53: Force Width Override
    "-1",                               // 54: Force Height Override
    
    false,                              // 55: Mixing Image Prompt and Vary/Upscale
    false,                              // 56: Mixing Image Prompt and Inpaint
    
    0.25,                               // 57: ControlNet Softness
    false,                              // 58: Enable FreeU
    
    false,                              // 59: Debug Inpaint Preprocessing
    false,                              // 60: Disable initial latent in inpaint
    
    // Inpaint Engine Settings (specific to fn_index 60)
    "v2.6",                             // 61: Inpaint Engine ✅ STRING!
    0.7,                                // 62: Inpaint Denoising Strength (use stringified float!)
    1.0,                                // 63: Inpaint Respective Field
    
    // Advanced Mask Mod Params (64-66)
    false,                              // 64: Enable Advanced Masking
    false,                              // 65: Invert Mask
    0                                   // 66: Mask Erode or Dilate
  ],
  "session_hash": "unique-session-identifier"
}
```

### Key Differences from fn_index 48

| Aspect | fn_index 48 | fn_index 60 |
|--------|-------------|-------------|
| **File Input** | Base64 encoded | File paths (upload first) |
| **Use Case** | Simple inpainting | Advanced workflow |
| **Model Options** | Basic models only | Supports mask models, SAM options |
| **Complexity** | Lower | Higher - more parameters |

---

## 📦 Endpoint 3: fn_index 73 - Generation + Inpaint

### Description
Combined endpoint that handles both regular image generation and inpainting workflows. Returns gallery output for batch results.

### Request Payload (Similar to fn_index 60)

Uses same structure as fn_index 60 but optimized for gallery-based output with multiple generated images.

---

## 📤 File Upload Endpoint (`/upload`)

Gradio's standard file upload endpoint for storing files in temporary storage.

### Usage

```javascript
const formData = new FormData();
formData.append('files', fileBlob, filename);  // e.g., "source.png"

await fetch(`${FOCUS_SERVER_URL}/upload`, {
  method: 'POST',
  body: formData
});
```

### Response Formats

**Format 1 - Direct Path (String)**:
```json
"/tmp/user/session/source.png"
```

**Format 2 - Array with Object**:
```json
[
  {
    "name": "/tmp/user/session/source.png",
    "size": 1048576,
    "uploaded_at": "2024-01-15T10:30:00Z"
  }
]
```

**Format 3 - Array with Direct String**:
```json
["/tmp/user/session/source.png"]
```

### Upload Helper Function (from source code)

```javascript
const uploadToGradio = async (baseUrl, base64OrBlob, filename, mimeType, debug = true) => {
  let fileBlob;
  
  // Convert base64 to Blob if needed
  if (typeof base64OrBlob === 'string') {
    try {
      const parts = base64OrBlob.split(',');
      const contentType = parts[0].match(/:(.*?);/);
      const byteCharacters = atob(parts[1]);
      
      // Process in 256KB chunks to avoid memory issues
      const sliceSize = 256 * 1024;
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Uint8Array(slice.length);
        for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
        byteArrays.push(new Blob([byteNumbers], { type: mimeType }));
      }
      
      fileBlob = new Blob(byteArrays, { type: mimeType });
    } catch (e) {
      throw new Error(`Failed to parse image data: ${e.message}`);
    }
  } else {
    fileBlob = base64OrBlob;
  }
  
  const uploadUrl = `${baseUrl}/upload`;
  const formData = new FormData();
  formData.append('files', fileBlob, filename);
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
  
  const uploadResult = await response.json();
  
  // Handle different response formats
  let fileName;
  if (typeof uploadResult === 'string') {
    fileName = uploadResult.trim();
  } else if (Array.isArray(uploadResult)) {
    if (uploadResult[0] && typeof uploadResult[0] === 'object' && uploadResult[0].name) {
      fileName = uploadResult[0].name;
    } else {
      fileName = uploadResult[0].trim();
    }
  } else if (uploadResult && typeof uploadResult === 'object') {
    fileName = uploadResult.name || uploadResult.trim();
  }
  
  return {
    name: fileName,
    data: null,
    is_file: true,
    uploadedUrl: `${baseUrl}/${fileName}`
  };
};
```

---

## 📋 Parameter Type Requirements

### CRITICAL RULES (from gradio_hijack.py assertion errors)

1. **All text inputs MUST be strings** - Even if they look like booleans or numbers, convert them to strings before sending:
   ```javascript
   // ❌ WRONG - Will cause AssertionError in gradio_hijack.py
   fn_index: 60,
   data: [false, "prompt", ...]  // false is a boolean!
   
   // ✅ CORRECT - Convert to string
   fn_index: 60,
   data: ["false", "prompt", ...]  // Everything is a string!
   ```

2. **Styles parameter MUST be an array** - Never pass as string:
   ```javascript
   // ❌ WRONG
   "Fooocus V2"
   
   // ✅ CORRECT
   ["Fooocus V2"]
   ```

3. **File paths must be strings from upload response** - Don't use object properties directly:
   ```javascript
   // ❌ WRONG
   "/tmp/user/object.property"  // Might not work
   
   // ✅ CORRECT  
   uploadedImage.name  // Always use the .name property
   ```

---

## 🔍 Response Parsing Logic

The API client handles multiple response formats from Gradio/Fooocus:

### Gallery Array Responses (Most Common)
```javascript
[
  {
    "image": {
      "url": "/file/generated.png",
      "base64": "data:image/png;base64,iVBOR...",
      "is_final": true
    },
    "name": "/tmp/session/generated.png"
  }
]
```

### Single Image Object
```javascript
{
  "image": {
    "url": "/file/generated.png",
    "base64": "data:image/png;base64,iVBOR...",
    "is_final": true
  }
}
```

### Direct URL Response
```javascript
{
  "output_url": "/file/generated.png"
}
```

### Base64 String Directly
```javascript
"data:image/png;base64,iVBOR..."
```

### Gradio HTML Response (with embedded image)
```javascript
{
  "html": "<img src='/file/generated.png' ...>",
  "gallery": [...]  // May contain images too
}
```

### Extraction Helper Code
```javascript
const extractImageFromResponse = (baseUrl, result) => {
  // Handle gallery array responses
  if (result && Array.isArray(result)) {
    for (const item of result) {
      if (item && typeof item === 'object' && item.image) {
        return item.image.url || item.image;
      }
      if (item && typeof item === 'object' && item.name) {
        return `${baseUrl}/file=${item.name}`;
      }
    }
  }

  // Handle single image with data property
  if (result && result.data && Array.isArray(result.data)) {
    for (const item of result.data) {
      if (item && typeof item === 'object' && item.image) {
        return item.image.url || item.image.base64 || item.image;
      }
      if (item && typeof item === 'object' && item.name) {
        return `${baseUrl}/file=${item.name}`;
      }
      
      // Check for direct image URL in array
      const imageUrl = result.data.find(item => 
        typeof item === 'string' && item.match(/\.(jpg|jpeg|png|webp)$/i)
      );
      if (imageUrl) return `${baseUrl}/file=${imageUrl}`;
    }
  }

  // Fallback: search response for image URLs
  const baseUrlObj = new URL(baseUrl);
  const imageMatches = Object.values(result).flatMap(v => 
    Array.isArray(v) ? v : [v]
  ).flat().filter(
    item => typeof item === 'string' && 
            (item.includes('tmp') || item.match(/\.(jpg|jpeg|png|webp)$/i))
  );

  if (imageMatches.length > 0) {
    return `${baseUrlObj.origin}${imageMatches[0]}`;
  }

  throw new Error('Failed to extract image from response');
};
```

---

## 🚨 Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `500 Internal Server Error` | Wrong fn_index or payload structure | Check if using correct endpoint for your workflow |
| `403 Forbidden` | Authentication required or server misconfiguration | Verify Focus server is running with proper config |
| `Connection refused` | Server not running on specified URL | Start Focus/Gradio server first |
| `AssertionError in gradio_hijack.py` | Non-string values where strings expected | Convert all text inputs to strings! |
| `Upload failed: 403` | Upload endpoint blocked | Check CORS settings and server config |

### Error Response Examples

**500 Error**:
```javascript
{
  "error": "Internal Server Error",
  "detail": "Invalid payload structure for fn_index 60"
}
```

**403 Forbidden**:
```javascript
{
  "error": "Access denied: authentication required"
}
```

---

## 🔄 Workflow Examples

### Example 1: Simple Inpainting (fn_index 48)

```javascript
const originalImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...";
const maskImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...";
const prompt = "change to swimsuit";

const result = await sendToFooocus(originalImage, maskImage, prompt, {
  negativePrompt: "unrealistic, bad quality",
  styles: ["Fooocus V2"],
  performance: "Quality",
  aspectRatio: "1024×1024"
});

// result contains the generated image URL or base64
```

### Example 2: Advanced Inpainting (fn_index 60)

```javascript
// Step 1: Upload images to Gradio storage
const uploadedImage = await uploadToGradio(baseUrl, originalImage, "source.png");
const uploadedMask = await uploadToGradio(baseUrl, maskImage, "mask.png");

// Step 2: Send request with file paths
const result = await sendToFooocus(originalImage, maskImage, prompt, {
  negativePrompt: "unrealistic",
  styles: ["Fooocus V2"],
  performance: "Quality",
  aspectRatio: "1024×1024",
  u_percentage: 0.7,
  inpaint_respective_field: true
});
```

---

## 🛠️ Debug Mode Configuration

Enable detailed logging to see all requests and responses:

```env
DEBUG_MODE=true
```

This will output:
- Full request payloads sent to API
- Response data from server  
- Detailed error messages with structure info

Example debug output:
```
🎨 === FOOOCUS PIPELINE REQUEST (Fixed String Handling) ===
📝 Uploading assets to server temporary storage...
📤 Uploading file: source.png
✅ Image blob created: 1024768 bytes
📤 Upload URL: http://127.0.0.1:7865/upload
📦 Uploaded file path: /tmp/user/session/source.png
📝 Dispatching inpainting request...
📝 Payload fn_index: 48
✅ All string values properly formatted for gradio_hijack.py
📝 Payload styles: ["Fooocus V2"]
✅ === FOOOCUS PIPELINE REQUEST COMPLETED ===
```

---

## 🔒 Security Notes

1. **Images processed locally** - Only the mask and image are sent to your local Focus instance
2. **CORS requirements** - Ensure Focus server allows cross-origin requests from your app origin
3. **Environment variables** - Never commit `.env` files to version control (already in .gitignore)

---

## 📚 Related Documentation

- [README.md](./README.md) - Main project documentation  
- [API_ENDPOINT_FIX.md](./API_ENDPOINT_FIX.md) - API endpoint fix details
- [CONTINUE.md](./CONTINUE.md) - Development guide and roadmap
- [QUICK_START.md](./QUICK_START.md) - Quick start guide
- [Gradio Client Docs](https://www.gradio.app/docs/client/javascript) - Official Gradio API reference

---

## 📝 Version Information

| Version | Changes | Notes |
|---------|---------|-------|
| 1.0.0 | Initial implementation | Basic inpainting support |
| 1.1.0 | Environment variable config | Added .env and .env.example |
| 1.2.0 | Gradio API integration | Enhanced response handling |
| 1.3.0 | Fixed fn_index issues | Switched to optimized endpoints |
| 1.4.0 | String type fix | Fixed gradio_hijack.py errors |

---

## ✅ Quick Checklist

Before using the API:

- [ ] Focus server is running on `http://127.0.0.1:7865`
- [ ] `.env` file configured with correct `FOCUS_SERVER_URL`
- [ ] Development server started (`npm run dev`)
- [ ] Can visit `http://localhost:3000` in browser
- [ ] Uploaded image loads correctly
- [ ] Canvas drawing works
- [ ] Generate Result button responds

---

**Status**: ✅ API documentation complete  
**Last Updated**: 2024-01-15  
**Author**: Development Team  
