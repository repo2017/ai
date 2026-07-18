/**
 * Fooocus API Client Core - FIXED VERSION for fn_index: 67 with proper file uploads
 */

function getEnvValue(key, defaultValue) {
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key];
  } else if (typeof window !== 'undefined') {
    let searchParams = new URLSearchParams(window.location.search);
    const urlValue = searchParams.get(key);
    if (urlValue) return urlValue;
  }
  return defaultValue;
}

export let FOCUS_SERVER_URL = getEnvValue('FOCUS_SERVER_URL', 'http://127.0.0.1:7865');
if (typeof window !== 'undefined') {
  const storedUrl = localStorage.getItem('FOCUS_SERVER_URL');
  if (storedUrl) FOCUS_SERVER_URL = storedUrl;
}

export let DEBUG_MODE = getEnvValue('DEBUG_MODE', 'false').toString().toLowerCase() === 'true';

// =========================================================================
// Upload helper - converts base64 to file blob and uploads to Gradio /upload endpoint
// =========================================================================

const uploadToGradio = async (baseUrl, base64OrBlob, filename = "image.png", mimeType = "image/png", debug = true) => {
  console.log('📤 Uploading file:', filename);
  
  let fileBlob;
  if (typeof base64OrBlob === 'string') {
    try {
      if (base64OrBlob.startsWith('data:')) {
        const parts = base64OrBlob.split(',');
        const contentType = parts[0].match(/:(.*?);/) || mimeType;
        const byteCharacters = atob(parts[1]);
        const byteArrays = [];
        
        // Process in chunks to avoid memory issues with large images
        const sliceSize = 256 * 1024; // 256KB chunks
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
          const slice = byteCharacters.slice(offset, offset + sliceSize);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
          byteArrays.push(new Uint8Array(byteNumbers));
        }
        fileBlob = new Blob(byteArrays, { type: contentType });
        console.log('✅ Image blob created:', fileBlob.size, 'bytes');
      } else {
        const byteCharacters = atob(base64OrBlob);
        const byteNumbers = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        fileBlob = new Blob([byteNumbers], { type: 'image/png' });
        console.log('✅ Image blob created:', fileBlob.size, 'bytes');
      }
    } catch (e) {
      console.error('❌ Error creating image blob:', e.message);
      throw new Error(`Failed to parse image data: ${e.message}`);
    }
  } else {
    fileBlob = base64OrBlob;
  }

  // Use Gradio's upload endpoint - make sure we're using the right path
  const uploadUrl = `${FOCUS_SERVER_URL}/upload`;
  console.log(`📤 Upload URL: ${uploadUrl}`);
  
  const formData = new FormData();
  formData.append('files', fileBlob, filename);
  
  const response = await fetch(uploadUrl, { 
    method: 'POST', 
    body: formData 
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Upload failed:', response.status, response.statusText);
    console.error('Error response:', errorText.substring(0, 500));
    
    // Check for specific errors
    if (errorText.includes('403') || errorText.includes('forbidden')) {
      throw new Error('Focus server requires authentication. Please check your server is running with proper config.');
    }
    
    if (errorText.includes('503') || errorText.includes('unavailable')) {
      throw new Error('Focus server is not available or overloaded');
    }

    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }

  const uploadResult = await response.json();
  console.log('✅ Upload successful, result:', JSON.stringify(uploadResult, null, 2));
  
  // Validate response format - Gradio returns array with file info
  if (!uploadResult || !Array.isArray(uploadResult) || !uploadResult[0]) {
    console.error('❌ Upload response missing file name', uploadResult);
    throw new Error(`Upload response invalid: ${JSON.stringify(uploadResult)}`);
  }

  const result = { 
    name: uploadResult[0].name,           // File path returned by Gradio
    data: null,
    is_file: true,
    originalSize: fileBlob.size,
    uploadedUrl: `${FOCUS_SERVER_URL}/${uploadResult[0].name}`
  };
  
  if (debug) {
    console.log('📦 Uploaded file path:', result.name);
    console.log('📊 File size:', result.originalSize, 'bytes');
  }
  
  return result;
};

// =========================================================================
// Core API Request Function using fn_index: 67 for inpainting
// This matches the Gradio Fooocus API that expects pre-uploaded files
// =========================================================================

export const sendToFooocus = async (originalBase64, maskBase64, prompt, options = {}) => {
  console.log('🎨 === FOOOCUS PIPELINE REQUEST (fn_index: 67 Inpaint Mode) ===');
  
  const baseUrl = FOCUS_SERVER_URL.replace(/\\$/, "");
  const targetUrl = `${baseUrl}/api/predict`;
  const uniqueSessionHash = Math.random().toString(36).substring(2, 11);

  try {
    const safePrompt = prompt || "Modify content";
    
    // =========================================================================
    // UPLOAD FILES FIRST TO GRADIO STORAGE
    // =========================================================================
    console.log('📝 Uploading assets to server temporary storage...');
    
    // Upload with proper file handling
    const uploadedImage = await uploadToGradio(baseUrl, originalBase64, "source.png", DEBUG_MODE);
    const uploadedMask = await uploadToGradio(baseUrl, maskBase64, "mask.png", DEBUG_MODE);

    // Verify uploads succeeded
    if (!uploadedImage.name) {
      throw new Error(`Failed to upload source image. Got: ${JSON.stringify(uploadedImage)}`);
    }
    if (!uploadedMask.name) {
      throw new Error(`Failed to upload mask. Got: ${JSON.stringify(uploadedMask)}`);
    }

    console.log('📝 Uploaded image path:', uploadedImage.name);
    console.log('📝 Uploaded mask path:', uploadedMask.name);

    // =========================================================================
    // REQUEST PAYLOAD (fn_index: 67 - Outpaint/Inpaint mode)
    // =========================================================================
    console.log('📝 Dispatching inpainting request...');

    const structuralPayload = {
      fn_index: 67,
      
      data: [
        false,                                                 // 0: Generate Image Grid for Each Batch (checkbox)
        safePrompt,                                            // 1: Positive Prompt Textbox
        options.negativePrompt || "unrealistic, bad quality",  // 2: Negative Prompt Textbox
        options.styles || ["Fooocus V2"],                      // 3: Selected Styles (must be array!)
        options.performance || "Quality",                      // 4: Performance (Radio)
        options.aspectRatio || "1024×1024",                    // 5: Aspect Ratios (Radio)
        1,                                                     // 6: Image Number (Slider)
        "png",                                                 // 7: Output Format (Radio)
        options.seed || "-1",                                  // 8: Seed (Textbox)
        false,                                                 // 9: Read wildcards in order (Checkbox)
        options.imageSharpness || 0,                           // 10: Image Sharpness (Slider)
        options.guidanceScale || 1,                            // 11: Guidance Scale (Slider)
        "None",                                                // 12: Base Model (Dropdown - SDXL only)
        "None",                                                // 13: Refiner (Dropdown - SDXL or SD 1.5)
        0.1,                                                   // 14: Refiner Switch At (Slider)

        // LoRA Blocks Setup Stack (all disabled)
        false, "None", 0,                                      // 15-17: LoRA 1
        false, "None", 0,                                      // 18-20: LoRA 2
        false, "None", 0,                                      // 21-23: LoRA 3
        false, "None", 0,                                      // 24-26: LoRA 4
        false, "None", 0,                                      // 27-29: LoRA 5

        // Inpaint Component Settings Target Layout Map
        true,                                                  // 30: Input Image (Checkbox)
        "",                                                    // 31: parameter_212 (Textbox - tracking container)
        options.upScaleOrVariation || "Disabled",               // 32: Upscale or Variation (Radio)
        "",                                                    // 33: Canvas placeholder (Image - expects string path)
        ["Left"],                                              // 34: Outpaint Directions (Checkboxgroup)
        uploadedImage.name,                                    // 35: Inpaint Input Source Image (PATH STRING!)
        safePrompt,                                            // 36: Inpaint Additional Prompt (Textbox)
        uploadedMask.name,                                     // 37: Mask Upload Target Layer (PATH STRING!)

        // Advanced Debug Mode Configuration Toggles
        false,                                                 // 38: Disable Preview (Checkbox)
        true,                                                  // 39: Enable Advanced Masking Features (Checkbox)
        true,                                                  // 40: Disable Intermediate Results (Checkbox)
        false,                                                 // 41: Disable seed increment (Checkbox)
        false,                                                 // 42: Black Out NSFW (Checkbox)
        1.5,                                                   // 43: Positive ADM Guidance Scaler (Slider)
        0.8,                                                   // 44: Negative ADM Guidance Scaler (Slider)
        0.3,                                                   // 45: ADM Guidance End At Step (Slider)
        7,                                                     // 46: CFG Mimicking from TSNR (Slider)
        2,                                                     // 47: CLIP Skip (Slider)
        "dpmpp_2m_sde_gpu",                                    // 48: Sampler (Dropdown)
        "karras",                                              // 49: Scheduler (Dropdown)
        "Default (model)",                                     // 50: VAE (Dropdown)
        -1,                                                    // 51: Forced Overwrite of Sampling Step (Slider)
        -1,                                                    // 52: Forced Overwrite of Refiner Switch Step (Slider)
        -1,                                                    // 53: Forced Overwrite of Generating Width (Slider)
        -1,                                                    // 54: Forced Overwrite of Generating Height (Slider)
        false,                                                 // 55: Mixing Image Prompt and Vary/Upscale (Checkbox)
        false,                                                 // 56: Mixing Image Prompt and Inpaint (Checkbox)

        // FreeU Parameters
        64,                                                    // 57: Canny Low Threshold (Slider)
        128,                                                   // 58: Canny High Threshold (Slider)
        "joint",                                               // 59: Refiner swap method (Dropdown)
        0.25,                                                  // 60: Softness of ControlNet (Slider)

        // FreeU Activation Layer parameters
        false,                                                 // 61: Enable FreeU (Checkbox)
        1.01,                                                  // 62: B1 (Slider)
        1.02,                                                  // 63: B2 (Slider)
        0.99,                                                  // 64: S1 (Slider)
        0.95,                                                  // 65: S2 (Slider),

        // Debug & Inpaint Preprocessing
        false,                                                 // 66: Debug Inpaint Preprocessing (Checkbox)
        options.disableInitialLatent || false,                 // 67: Disable initial latent in inpaint (Checkbox)

        // Inpaint Engine Block
        "v2.6",                                                // 68: Inpaint Engine (Dropdown)
        1,                                                     // 69: Inpaint Denoising Strength (Slider)
        options.inpaintRespectiveField || 1,                   // 70: Inpaint Respective Field (Slider)

        // Advanced Mask Modification Parameters
        false,                                                 // 71: Enable Advanced Masking Features (Checkbox) - duplicate but for structure
        false,                                                 // 72: Invert Mask When Generating (Checkbox)
        64,                                                    // 73: Mask Erode or Dilate (Slider)

        // File Outputs
        false,                                                 // 74: Save only final enhanced image (Checkbox)
        true,                                                  // 75: Save Metadata to Images (Checkbox),

        // Metadata
        "fooocus",                                             // 76: Metadata Scheme (Radio)

        // Image Prompts Core Slots Link Array
        "", 0, 0, "ImagePrompt",                               // 77-80: Image Prompt Slot 1
        "", 0, 0, "ImagePrompt",                               // 81-84: Image Prompt Slot 2
        "", 0, 0, "ImagePrompt",                               // 85-88: Image Prompt Slot 3
        "", 0, 0, "ImagePrompt",                               // 89-92: Image Prompt Slot 4

        // GroundingDINO Parameters
        false, 0, false, "",                                   // 93-96: GroundingDINO parameters

        // ENHANCEMENT MULTI-TAB MATRIX (Placeholder values)
        false, "Disabled", "Before First Enhancement", "Original Prompts", // 97-100
        false, "", "", "", "sam", "full", "vit_b", 0.25, 0.3, 0, true, "v2.6", 1, 0.618, 0, false, // 101-115 (Block #1)
        false, "", "", "", "sam", "full", "vit_b", 0.25, 0.3, 0, true, "v2.6", 1, 0.618, 0, false, // 116-130 (Block #2)
        false, "", "", "", "sam", "full", "vit_b", 0.25, 0.3, 0, true, "v2.6", 1, 0.618, 0, false, // 131-145 (Block #3)
        false                                                  // 146: Final block parameter completion entry
      ],

      session_hash: uniqueSessionHash
    };

    console.log('📝 Payload fn_index:', structuralPayload.fn_index);
    console.log('📝 Payload data array length:', structuralPayload.data.length);
    console.log('📦 Uploaded image path:', uploadedImage.name);
    console.log('📦 Uploaded mask path:', uploadedMask.name);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(structuralPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Response:', errorText);
      
      // Handle specific error codes
      if (errorText.includes('403')) {
        throw new Error('Focus server requires authentication. Please check your server is running with proper config.');
      }

      if (errorText.includes('503') || errorText.includes('unavailable')) {
        throw new Error('Focus server is not available or overloaded');
      }

      throw new Error(`Server returned error: ${response.status}. Details: ${errorText}`);
    }

    console.log('✅ === FOOOCUS PIPELINE REQUEST COMPLETED ===');
    
    const result = await response.json();
    
    if (DEBUG_MODE) {
      console.log('📦 Server Response:', JSON.stringify(result, null, 2));
    }

    return extractImageFromResponse(baseUrl, result);

  } catch (error) {
    console.error("❌ === INPAINTING REQUEST FAILED ===", error.message);
    
    // Specific error handling for common issues
    if (error.message.includes('Failed to parse')) {
      throw new Error(`Image data corrupted`);
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      throw new Error(`Cannot connect to Focus server at ${FOCUS_SERVER_URL}. Make sure the server is running.`);
    }

    throw error;
  }
};

// Helper function to extract image from Gradio response
const extractImageFromResponse = (baseUrl, result) => {
  // Handle gallery array responses (most common for inpainting)
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
    }

    // Check for direct image URL
    const imageUrl = result.data.find(item => 
      typeof item === 'string' && item.match(/\.(jpg|jpeg|png|webp)$/i)
    );
    if (imageUrl) return `${baseUrl}/file=${imageUrl}`;
  }

  // Handle Gradio update structure with gallery
  if (result && result.data && result.data[0]) {
    const item = result.data[0];
    
    // Gallery array
    if (item.gallery && Array.isArray(item.gallery)) {
      for (const img of item.gallery) {
        if (img && typeof img === 'object' && img.image && img.image.url) {
          return img.image.url;
        }
        if (img && typeof img === 'object' && img.name) {
          return `${baseUrl}/file=${img.name}`;
        }
      }
    }

    // Direct image property
    if (item.image && item.image.base64) {
      return item.image.url || item.image.base64;
    }

    // Choices array
    if (Array.isArray(item)) {
      for (const choice of item) {
        if (choice && typeof choice === 'object' && choice.name) {
          return `${baseUrl}/file=${choice.name}`;
        }
      }
    }
  }

  // Fallback: try to find any image URL in response
  const baseUrlObj = new URL(baseUrl);
  const imageMatches = Object.values(result).flatMap(v => Array.isArray(v) ? v : [v]).flat().filter(
    item => typeof item === 'string' && 
            (item.includes('tmp') || item.match(/\.(jpg|jpeg|png|webp)$/i))
  );

  if (imageMatches.length > 0) {
    return `${baseUrlObj.origin}${imageMatches[0]}`;
  }

  throw new Error('Failed to extract image from response');
};

export default sendToFooocus;
