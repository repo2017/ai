/**
 * Fooocus/Gradio API Client
 * 
 * Sends inpainting requests to a locally running Focus instance.
 * Supports both v1 API and Gradio API formats.
 */

// Browser-compatible environment variable reading
const getEnvValue = (key, defaultValue) => {
  // Try to load from .env file using native fetch
  try {
    if (typeof window !== 'undefined') {
      const envPath = `${window.location.hostname}/.env`;
      if (!envPath.startsWith('http')) {
        throw new Error('Cannot construct valid URL');
      }
      // Skip .env file fetching in browser for simplicity
    }
  } catch (e) {
    // Ignore errors, fall back to process.env or defaults
  }

  // Check process.env first (for when running with proper env loading)
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key];
  }

  // For browser environment, check window object
  if (typeof window !== 'undefined') {
    const winKey = key.replace(/_/g, '\\u05E0'); // Browser polyfill for underscores
    // Use simple URL parameter fallback or localStorage
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has(key)) return searchParams.get(key);
    } catch (e) {}
  }

  // Otherwise use default
  return defaultValue;
};

const FOCUS_SERVER_URL = getEnvValue(
  'FOCUS_SERVER_URL',
  'http://127.0.0.1:7865'
);

// For browser, we can also set this via URL parameter or localStorage
if (typeof window !== 'undefined') {
  const searchParams = new URLSearchParams(window.location.search);
  const urlFromParams = searchParams.get('FOCUS_SERVER_URL');
  if (urlFromParams) {
    FOCUS_SERVER_URL = urlFromParams;
    console.log('✅ Using FOCUS_SERVER_URL from URL parameter:', FOCUS_SERVER_URL);
  }
}

// NEW: Also try to read from localStorage for dev convenience
if (typeof window !== 'undefined' && !FOCUS_SERVER_URL.startsWith('http')) {
  const storedUrl = localStorage.getItem('FOCUS_SERVER_URL');
  if (storedUrl) {
    FOCUS_SERVER_URL = storedUrl;
    console.log('✅ Using FOCUS_SERVER_URL from localStorage:', FOCUS_SERVER_URL);
  }
}

// NEW: Store current config for debugging
if (typeof window !== 'undefined') {
  window.DEBUG_CONFIG = { FOCUS_SERVER_URL, API_ENDPOINT, TIMEOUT_MS, DEBUG_MODE };
}

const API_ENDPOINT = getEnvValue(
  'API_ENDPOINT',
  'generation/image-inpaint'
);

// For browser, try localStorage as fallback
if (typeof window !== 'undefined' && !window.API_ENDPOINT) {
  const storedEndpoint = localStorage.getItem('FOCUS_API_ENDPOINT');
  if (storedEndpoint) {
    API_ENDPOINT = storedEndpoint;
  }
}

const TIMEOUT_MS = parseInt(getEnvValue('TIMEOUT_MS', '300000'), 10);

// For browser, try localStorage for timeout too
if (typeof window !== 'undefined' && isNaN(TIMEOUT_MS)) {
  const storedTimeout = localStorage.getItem('FOCUS_API_TIMEOUT');
  if (storedTimeout) {
    TIMEOUT_MS = parseInt(storedTimeout, 10);
  }
}

const DEBUG_MODE = getEnvValue('DEBUG_MODE', 'false').toLowerCase() === 'true';

// For browser, check URL params for debug mode
if (typeof window !== 'undefined' && !DEBUG_MODE) {
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('DEBUG_MODE') === 'true') {
    DEBUG_MODE = true;
    console.log('🐛 DEBUG MODE ENABLED via URL parameter');
  }
}

/**
 * Send inpainting request to Focus API (supports both v1 and Gradio APIs)
 * 
 * @param {string} originalBase64 - Original image as base64 data URL
 * @param {string} maskBase64 - Black & white mask (white = areas to change)
 * @param {string} prompt - AI prompt for the generation
 * @param {object} options - Additional configuration options
 * @returns {Promise<string>} URL of generated image or base64 data
 */
export const sendToFooocus = async (originalBase64, maskBase64, prompt, options = {}) => {
  // Default settings for Gradio API format
  const config = {
    negative_prompt: "low quality, blurry, ugly, deformed, disfigured",
    
    inpaint_specific: {
      u_percentage: options.uPercentage || 0.6,           // Denoising strength (0.0 to 1.0)
      inpaint_respective_field: options.respectiveField ?? true,  // Focus on masked area only
      mask_blur: options.maskBlur || 10,                 // Mask blur radius
    }
  };

  const payload = {
    prompt: prompt,
    negative_prompt: config.negative_prompt,
    
    // Inpainting specific fields (Gradio/Fooocus API)
    input_image: originalBase64,       // Base image (original)
    input_mask: maskBase64,           // Black & White mask we generated
    u_percentage: config.inpaint_specific.u_percentage,                 // Denoising strength
    inpaint_respective_field: config.inpaint_specific.inpaint_respective_field  // Focus generation only on masked area
  };

  const apiUrl = `${FOCUS_SERVER_URL}/${API_ENDPOINT}`;

  console.log('🎨 === FOCUS API REQUEST ===');
  console.log(`URL: ${apiUrl}`);
  console.log(`Payload keys:`, Object.keys(payload));
  
  if (DEBUG_MODE) {
    console.log('Full Payload:', JSON.stringify(payload, null, 2));
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // Optional: Set a timeout for the request
      signal: AbortSignal.timeout(TIMEOUT_MS) // 5 minute timeout by default
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      // If JSON parsing fails, it might be a direct URL or text
      console.warn('API returned non-JSON response');
      return response.url; // Return the URL if possible
    }

    console.log('✅ === SUCCESS ===');
    
    // Handle different possible response formats from Gradio/Fooocus
    let resultUrl;
    
    // Format 1: Array of images (v1 API)
    if (data.images && Array.isArray(data.images)) {
      console.log('Response format: images[] array');
      resultUrl = data.images[0].url || data.images[0].base64;
    } 
    // Format 2: Single image object (Gradio API)
    else if (data.image) {
      console.log('Response format: single image object');
      resultUrl = data.image.url || data.image.base64;
    } 
    // Format 3: Direct URL
    else if (data.output_url) {
      console.log('Response format: output_url');
      resultUrl = data.output_url;
    } 
    // Format 4: Direct image URL
    else if (data.url) {
      console.log('Response format: url field');
      resultUrl = data.url;
    } 
    // Format 5: Gradio HTML output with image embedded
    else if (typeof data === 'string' && data.includes('<img')) {
      console.log('Response format: Gradio HTML with image');
      // Extract the image URL from Gradio HTML response
      const imgMatch = data.match(/src="([^"]+)"/);
      if (imgMatch && imgMatch[1]) {
        resultUrl = imgMatch[1];
      } else {
        console.log('Full response:', data.substring(0, 200));
        throw new Error('Could not extract image URL from Gradio HTML response');
      }
    } 
    // Format 6: Base64 string directly
    else if (typeof data === 'string' && (data.length > 50 && data.includes(','))) {
      console.log('Response format: base64 string');
      resultUrl = data;
    } 
    // Format 7: Direct image URL as string
    else if (typeof data === 'string') {
      console.log('Response format: direct URL string');
      resultUrl = data;
    } 
    else {
      console.warn('Unexpected Fooocus response format:', typeof data, JSON.stringify(data).substring(0, 200));
      
      // If it's an object with gallery or output, try those
      if (data.gallery && Array.isArray(data.gallery)) {
        console.log('Response has gallery array');
        resultUrl = data.gallery[0].url || data.gallery[0];
      } else if (data.output_url) {
        console.log('Response has output_url');
        resultUrl = data.output_url;
      } else {
        // Fall back to first string field found
        const firstStringField = Object.entries(data).find(([k, v]) => typeof v === 'string')?.[1];
        if (firstStringField && firstStringField.length > 10) {
          resultUrl = firstStringField;
        } else {
          throw new Error('Unexpected response format from Focus API: ' + JSON.stringify(data).substring(0, 500));
        }
      }
    }

    console.log('=== RESULT URL ===', resultUrl.substring(0, 100) + '...');
    
    return resultUrl;
    
  } catch (error) {
    // Handle timeout
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      throw new Error('Request timed out. The image may be large or processing is taking longer than expected.');
    }
    
    // Handle network/connectivity errors
    let errorMessage = 'Connection failed to Focus API';
    if (error.cause) {
      if (error.cause.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to Focus API! Make sure:' + 
        '\n1. Focus is running on the specified server URL' +
        `\n2. It is listening on port ${getEnvValue('FOCUS_SERVER_URL', '7865').split(':')[1] || 'unknown'}` +
        '\n3. No firewall is blocking the connection';
      } else if (error.cause.code === 'ENOTFOUND') {
        errorMessage = `Cannot reach Focus server at: ${FOCUS_SERVER_URL}\nPlease check your FOCUS_SERVER_URL environment variable.`;
      } else {
        errorMessage = 'Connection error: ' + error.message;
      }
    } else {
      // Check if it's a 404
      const urlMatch = error.message.match(/(http.*\/)[^\s]+/);
      if (urlMatch && error.message.includes('404')) {
        errorMessage += '\n\n💡 404 ERROR - The endpoint might not exist!';
        errorMessage += '\n🔧 Try running this in browser console:';
        errorMessage += '\n  await diagnoseEndpoint()';
        errorMessage += '\n       (This will test connectivity and suggest alternatives)';
      }
      errorMessage = 'Failed to fetch from Focus API: ' + error.message;
    }
    
    console.error("❌ === ERROR ===", errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Test Focus API connection (health check)
 */
export const testFocusConnection = async () => {
  try {
    // Try health endpoint first (Gradio style)
    const healthUrl = `${FOCUS_SERVER_URL}/health`;
    console.log('🔍 Testing connection to:', healthUrl);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      return { connected: true, url: healthUrl, message: 'Focus API is running and responding!' };
    } else {
      console.log(`Health check returned ${response.status}, trying main endpoint...`);
    }
  } catch (error) {
    console.log('Health check failed, continuing with API test...');
  }

  // Try the main generation endpoint as fallback
  try {
    const response = await fetch(`${FOCUS_SERVER_URL}/${API_ENDPOINT}`, {
      method: 'HEAD',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      return { connected: true, url: `${FOCUS_SERVER_URL}/${API_ENDPOINT}`, message: 'Focus API is running!' };
    }
  } catch (error) {
    console.log('HEAD request failed:', error.message);
  }

  return { 
    connected: false, 
    message: `Cannot connect to Focus server at ${FOCUS_SERVER_URL}` 
  };
};

/**
 * NEW: Diagnose API endpoint issues (for debugging 404 errors)
 */
export const diagnoseEndpoint = async () => {
  console.log('\n🔍 === DIAGNOSING FOCUS ENDPOINT ===');
  console.log(`Current config: ${FOCUS_SERVER_URL}/${API_ENDPOINT}`);
  
  // Check if server is reachable
  try {
    const response = await fetch(`${FOCUS_SERVER_URL}/`, { method: 'HEAD', timeout: 5000 });
    if (response.ok) {
      console.log(`✅ Server base URL is reachable (${FOCUS_SERVER_URL})`);
    } else {
      throw new Error('Server responded with non-2xx status');
    }
  } catch (e) {
    console.error(`❌ Cannot reach Focus server at ${FOCUS_SERVER_URL}`);
    console.log('💡 Is Focus running? Try: npm start in the Focus directory');
    return { error: 'Server unreachable' };
  }

  // Test the specific endpoint
  try {
    const response = await fetch(`${FOCUS_SERVER_URL}/${API_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
      timeout: 5000
    });
    
    console.log(`✅ Endpoint ${FOCUS_SERVER_URL}/${API_ENDPOINT} responded with status: ${response.status}`);
    
    if (response.status === 404) {
      console.warn('⚠️  Getting 404 - endpoint might not exist');
      console.log('💡 Try these alternative paths:');
      const endpoints = [
        'generation/inpaint',
        'inpainting/image-inpaint',
        'text-to-image'
      ];
      for (const ep of endpoints) {
        try {
          const testResp = await fetch(`${FOCUS_SERVER_URL}/${ep}`, { method: 'HEAD' });
          if (testResp.ok || testResp.status === 404) {
            console.log(`  - ${ep}: ${testResp.status === 404 ? 'exists but requires body' : 'reachable'}`);
          }
        } catch {} // Silently continue
      }
    } else if (response.status >= 200 && response.status < 300) {
      console.log('✅ Endpoint is working correctly!');
      return { success: true };
    } else {
      const text = await response.text().catch(() => '');
      console.log(`Response body (${response.status}): ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.error(`❌ Endpoint test failed:`, error.message);
  }

  return { connected: false, message: 'Could not verify endpoint' };
};

/**
 * Get available styles from Focus (optional feature)
 */
export const getAvailableStyles = async () => {
  try {
    const response = await fetch(`${FOCUS_SERVER_URL}/styles`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.warn('Could not fetch available styles');
      return [];
    }
  } catch (error) {
    console.error('Error fetching styles:', error);
    return [];
  }
};

/**
 * Get API version info
 */
export const getApiInfo = async () => {
  try {
    const response = await fetch(`${FOCUS_SERVER_URL}/api`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.warn('Could not fetch API info');
      return null;
    }
  } catch (error) {
    console.error('Error fetching API info:', error);
    return null;
  }
};

export default sendToFooocus;
