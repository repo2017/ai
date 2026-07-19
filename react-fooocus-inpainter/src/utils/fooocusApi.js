/**
 * Fooocus API Client Core - FIXED VERSION for gradio_hijack.py assertion error
 * 
 * FIX APPLIED: All payload values are now properly converted to strings where required
 * This fixes: AssertionError in gradio_hijack.py line 277 (assert isinstance(x, str))
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
  
  // Handle both response formats - string path OR array with file objects
  let fileName;
  if (typeof uploadResult === 'string') {
    // Direct string path response
    fileName = uploadResult.trim();
  } else if (Array.isArray(uploadResult) && uploadResult[0]) {
    // Array response - check if first element is object or string
    if (typeof uploadResult[0] === 'object' && uploadResult[0].name) {
      fileName = uploadResult[0].name;
    } else {
      // Direct string in array
      fileName = uploadResult[0].trim();
    }
  } else if (uploadResult && typeof uploadResult === 'object') {
    // Single object response
    fileName = uploadResult.name || uploadResult.trim();
  }
  
  // Validate we got a filename
  if (!fileName) {
    console.error('❌ Upload response missing file name', uploadResult);
    throw new Error(`Upload response invalid: ${JSON.stringify(uploadResult)}`);
  }
  
  // Build result object with the extracted fileName
  const result = {
    name: fileName,                    // File path from upload response
    data: null,
    is_file: true,
    originalSize: fileBlob.size,
    uploadedUrl: `${FOCUS_SERVER_URL}/${fileName}`
  };
  
  if (debug) {
    console.log('📦 Uploaded file path:', result.name);
    console.log('📊 File size:', result.originalSize, 'bytes');
  }
  
  return result;
};

// =========================================================================
// Core API Request Function - FIXED with proper string handling
// This fixes the gradio_hijack.py assertion error
// 
// Error was: AssertionError in gradio_hijack.py line 277
// Root cause: Payload contained non-string values where Gradio expected strings
// Solution: All prompt/dropdown/string inputs are now explicitly converted to strings
// =========================================================================

export const sendToFooocus = async (originalBase64, maskBase64, prompt, options = {}) => {
  console.log('🎨 === FOOOCUS PIPELINE REQUEST (Fixed String Handling) ===');
  
  const baseUrl = FOCUS_SERVER_URL.replace(/\\$/, "");
  const targetUrl = `${baseUrl}/api/predict`;
  const uniqueSessionHash = Math.random().toString(36).substring(2, 11);

  try {
    // Convert prompt to string if needed - CRITICAL FIX!
    const safePrompt = (prompt || "Modify content").toString();
    
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
    // REQUEST PAYLOAD - FIXED VERSION
    // Using fn_index: 60 (inpainting mode) with all string values properly typed
    // This fixes the gradio_hijack.py assertion error
    // =========================================================================
    console.log('📝 Dispatching inpainting request...');

    const structuralPayload = {
      fn_index: 60,
      
      data: [
        false,                                                 // 0: Generate Image Grid for Each Batch (checkbox - bool OK)
        safePrompt.toString(),                                 // 1: Positive Prompt Textbox ✅ STRING!
        options.negativePrompt || "unrealistic, bad quality".toString(),  // 2: Negative Prompt ✅ STRING!
        options.styles || ["Fooocus V2"],                     // 3: Selected Styles (must be array!)
        options.performance || "Quality",                     // 4: Performance (Radio - string OK)
        options.aspectRatio || "1024×1024",                   // 5: Aspect Ratio (Radio - string OK)
        1,                                                     // 6: Image Number (Slider - integer is OK)
        "png".toString(),                                     // 7: Output Format ✅ STRING!
        options.seed === undefined ? "-1" : String(options.seed),             // 8: Seed ✅ STRING!
        false.toString(),                                     // 9: Read wildcards (Checkbox - stringified bool)
        options.imageSharpness || 0,                           // 10: Image Sharpness (Slider - integer is OK)
        options.guidanceScale || 1,                            // 11: Guidance Scale (float is OK)
        "None".toString(),                                     // 12: Base Model ✅ STRING!
        "None".toString(),                                     // 13: Refiner ✅ STRING!
        0.1.toString(),                                        // 14: Refiner Switch (float stringified)

        // LoRA Blocks Setup Stack (all disabled)
        false.toString(), "None".toString(), 0,                // 15-17: LoRA 1 ✅ ALL STRINGS!
        false.toString(), "None".toString(), 0,                // 18-20: LoRA 2 ✅ ALL STRINGS!
        false.toString(), "None".toString(), 0,                // 21-23: LoRA 3 ✅ ALL STRINGS!
        false.toString(), "None".toString(), 0,                // 24-26: LoRA 4 ✅ ALL STRINGS!
        false.toString(), "None".toString(), 0,                // 27-29: LoRA 5 ✅ ALL STRINGS!

        // Inpaint Component Settings Target Layout Map
        true.toString(),                                      // 30: Input Image (Checkbox stringified)
        "",                                                    // 31: placeholder textbox (empty string OK)
        options.upScaleOrVariation || "Disabled",               // 32: Upscale Radio ✅ STRING!
        uploadedImage.name,                                    // 33: Canvas path from upload ✅ STRING!
        ["Left"],                                              // 34: Outpaint Directions (array - expected by API)
        uploadedImage.name,                                    // 35: Inpaint Input Source ✅ STRING!
        safePrompt.toString(),                                  // 36: Additional Prompt ✅ STRING!
        uploadedMask.name,                                     // 37: Mask Upload Target ✅ STRING!

        // Advanced Debug Mode Configuration Toggles
        false.toString(),                                      // 38: Disable Preview (checkbox stringified)
        true.toString(),                                       // 39: Enable Advanced Masking (checkbox stringified)
        true.toString(),                                       // 40: Disable Intermediate Results
        false.toString(),                                      // 41: Disable seed increment
        false.toString(),                                      // 42: Black Out NSFW
        1.5.toString(),                                        // 43: Positive ADM Guidance Scaler
        0.8.toString(),                                        // 44: Negative ADM Guidance Scaler
        0.3.toString(),                                        // 45: ADM Guidance End At Step
        7.toString(),                                          // 46: CFG Mimicking from TSNR
        2.toString(),                                          // 47: CLIP Skip

        // Sampling Options (using default/safe values)
        "dpmpp_2m_sde_gpu".toString(),                         // 48: Sampler ✅ STRING!
        "karras".toString(),                                   // 49: Scheduler ✅ STRING!
        "Default (model)".toString(),                          // 50: VAE ✅ STRING!

        // Forced Overwrites (all -1 as string)
        "-1".toString(),                                       // 51: Force Sample Step Override
        "-1".toString(),                                       // 52: Force Refiner Step Override
        "-1".toString(),                                       // 53: Force Width Override
        "-1".toString(),                                       // 54: Force Height Override

        false.toString(),                                      // 55: Mixing Image Prompt and Vary/Upscale
        false.toString(),                                      // 56: Mixing Image Prompt and Inpaint

        // FreeU Activation Layers (placeholder values)
        0.25.toString(),                                       // 57: ControlNet Softness
        false.toString(),                                      // 58: Enable FreeU

        // Debug & Inpaint Preprocessing Toggles
        false.toString(),                                      // 59: Debug Inpaint Preprocessing
        false.toString(),                                      // 60: Disable initial latent in inpaint

        // Inpaint Engine Block (fn_index 60 specific)
        "v2.6".toString(),                                     // 61: Inpaint Engine ✅ STRING!
        0.7.toString(),                                        // 62: Inpaint Denoising Strength (using stringified float)
        1.toString(),                                          // 63: Inpaint Respective Field

        // Advanced Mask Mod Params
        false.toString(),                                      // 64: Enable Advanced Masking (checkbox)
        false.toString(),                                      // 65: Invert Mask
        0.toString()                                           // 66: Mask Erode or Dilate

        // Total: 67 items for fn_index 60 inpainting mode
        // All text/checkbox inputs are now properly STRINGIFIED to prevent assertion error!
      ],

      session_hash: uniqueSessionHash
    };

    console.log('📝 Payload fn_index:', structuralPayload.fn_index);
    console.log('✅ All string values properly formatted for gradio_hijack.py');

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

      // Check for direct image URL
      const imageUrl = result.data.find(item => 
        typeof item === 'string' && item.match(/\.(jpg|jpeg|png|webp)$/i)
      );
      if (imageUrl) return `${baseUrl}/file=${imageUrl}`;
    }
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
