/**
 * Fooocus API Client
 * 
 * Sends inpainting requests to a local Fooocus instance running on 127.0.0.1:8888
 */

const FOOOCUS_API_URL = 'http://127.0.0.1:8888/api/v1/generation/image-inpaint'

/**
 * Send inpainting request to Fooocus API
 * 
 * @param {string} originalBase64 - Original image as base64 data URL
 * @param {string} maskBase64 - Black & white mask (white = areas to change)
 * @param {string} prompt - AI prompt for the generation
 * @param {object} options - Additional configuration options
 * @returns {Promise<string>} URL of generated image or base64 data
 */
export const sendToFooocus = async (originalBase64, maskBase64, prompt, options = {}) => {
  // Default settings
  const config = {
    negative_prompt: "low quality, blurry",
    style_selections: ["Fooocus V2", "Fooocus Enhance"],
    performance_selection: "Speed", // Speed, Quality, or Extreme Speed
    
    inpaint_specific: {
      u_percentage: options.uPercentage || 0.6,           // Denoising strength (0.0 to 1.0)
      inpaint_respective_field: options.respectiveField ?? true,  // Focus on masked area only
      mask_blur: options.maskBlur || 10,                 // Mask blur radius
    }
  }

  const payload = {
    prompt: prompt,
    negative_prompt: config.negative_prompt,
    style_selections: config.style_selections,
    performance_selection: config.performance_selection,
    
    // Inpainting specific fields
    input_image: originalBase64,       // Base image (original)
    input_mask: maskBase64,           // Black & White mask we generated
    u_percentage: config.inpaint_specific.u_percentage,                 // Denoising strength
    inpaint_respective_field: config.inpaint_specific.inpaint_respective_field  // Focus generation only on masked area
  }

  console.log('Sending to Fooocus API...')
  console.log('Payload:', JSON.stringify(payload, null, 2))

  try {
    const response = await fetch(FOOOCUS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // Optional: Set a timeout for the request
      signal: AbortSignal.timeout(options.timeout || 300000) // 5 minute timeout by default
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    
    // Handle different possible response formats from Fooocus
    let resultUrl
    
    if (data.images && Array.isArray(data.images)) {
      // Array of images - take the first one
      resultUrl = data.images[0].url || data.images[0].base64
    } else if (data.image) {
      resultUrl = data.image.url || data.image.base64
    } else if (data.output_url) {
      resultUrl = data.output_url
    } else if (typeof data === 'string') {
      // Direct base64 string
      resultUrl = data
    } else {
      console.warn('Unexpected Fooocus response format:', data)
      throw new Error('Unexpected response format from Fooocus API')
    }

    console.log('Fooocus generation successful!')
    console.log('Result URL:', resultUrl)
    
    return resultUrl
    
  } catch (error) {
    // Handle timeout
    if (error.name === 'TimeoutError') {
      throw new Error('Request timed out. The image may be large or processing is taking longer than expected.')
    }
    
    // Handle network/connectivity errors
    let errorMessage = 'Connection failed to Fooocus API'
    if (error.cause) {
      if (error.cause.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to Fooocus API! Make sure:' + 
        '\n1. Fooocus is running locally' +
        '\n2. It is listening on port 8888' +
        '\n3. No firewall is blocking the connection'
      } else {
        errorMessage = 'Connection error: ' + error.message
      }
    } else {
      errorMessage = 'Failed to fetch from local Fooocus API: ' + error.message
    }
    
    console.error("Failed to fetch from local Fooocus API:", error)
    throw new Error(errorMessage)
  }
}

/**
 * Test Fooocus API connection
 */
export const testFooocusConnection = async () => {
  try {
    const response = await fetch(`${FOOOCUS_API_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.ok) {
      return { connected: true, message: 'Fooocus API is running and responding!' }
    } else {
      return { 
        connected: false, 
        message: `Health check failed with status ${response.status}` 
      }
    }
  } catch (error) {
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
      return { 
        connected: false, 
        message: 'Fooocus API is not running or unreachable. Please start Fooocus first.' 
      }
    }
    return { 
      connected: false, 
      message: 'Connection error: ' + error.message 
    }
  }
}

/**
 * Get available styles from Fooocus (optional feature)
 */
export const getAvailableStyles = async () => {
  try {
    const response = await fetch(`${FOOOCUS_API_URL}/styles`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.ok) {
      return await response.json()
    } else {
      console.warn('Could not fetch available styles')
      return []
    }
  } catch (error) {
    console.error('Error fetching styles:', error)
    return []
  }
}

export default sendToFooocus
