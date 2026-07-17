import React, { useState, useRef } from 'react'
import InpaintCanvas from './components/InpaintCanvas.jsx'
import { sendToFooocus } from './utils/fooocusApi.js'

const App = () => {
  const [imageSrc, setImageSrc] = useState(null)
  const [resultImage, setResultImage] = useState(null)
  const [prompt, setPrompt] = useState('undress this girl')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('idle') // idle, processing, success, error

  const fileInputRef = useRef(null)
  let urlInput = null // eslint-disable-line no-unused-vars

  // Handle image upload from local files or URL
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImageSrc(event.target.result)
        setStatus('idle')
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle URL input
  const handleUrlSubmit = () => {
    if (!urlInput || !urlInput.value.trim()) return
    setImageSrc(urlInput.value)
    setStatus('idle')
    setError(null)
  }

  // Generate mask (convert red strokes to black & white mask)
  const generateMaskBase64 = (canvas, coords, brushSize) => {
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = canvas.width
    maskCanvas.height = canvas.height
    const mCtx = maskCanvas.getContext('2d')

    if (!mCtx) return null

    // Fill background with black
    mCtx.fillStyle = '#000000'
    mCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)

    // Draw strokes in white
    mCtx.strokeStyle = '#ffffff'
    mCtx.lineWidth = brushSize || 20
    mCtx.lineCap = 'round'
    mCtx.lineJoin = 'round'

    const strokes = canvas.coords || []
    strokes.forEach((stroke) => {
      if (stroke.length < 1) return
      mCtx.beginPath()
      mCtx.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length; i++) {
        mCtx.lineTo(stroke[i].x, stroke[i].y)
      }
      mCtx.stroke()
    })

    return maskCanvas.toDataURL('image/png')
  }

  // Export button handler
  const handleExport = () => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const maskBase64 = generateMaskBase64(canvas, canvas.coords, canvas.brushSize)
    const originalBase64 = imageSrc

    // Send to Fooocus API
    setLoading(true)
    setStatus('processing')
    setError(null)

    sendToFooocus(originalBase64, maskBase64, prompt)
      .then((resultUrl) => {
        setResultImage(resultUrl)
        setStatus('success')
      })
      .catch((err) => {
        console.error(err)
        setError(err.message || 'Failed to process image')
        setStatus('error')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // Download result button
  const handleDownload = () => {
    if (!resultImage) return
    const link = document.createElement('a')
    link.href = resultImage
    link.download = `fooocus-result-${Date.now()}.png`
    link.click()
  }

  const canvasRef = useRef(null) // eslint-disable-line no-unused-vars

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Fooocus Inpainter - AI Image Undress Tool</h1>

      {/* Image Upload Section */}
      <div style={styles.uploadSection}>
        <button onClick={() => fileInputRef.current.click()} style={styles.buttonPrimary}>
          📁 Choose Image from Device
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />

        <div style={styles.inputContainer}>
          <input
            type="text"
            placeholder="Or paste image URL here..."
            style={styles.urlInput}
            ref={(el) => (urlInput = el)}
          />
          <button onClick={handleUrlSubmit} style={styles.buttonSecondary}>
            Load from URL
          </button>
        </div>

        {/* AI Prompt Input */}
        <div style={styles.promptSection}>
          <label style={styles.label}>AI Prompt:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to generate (e.g., 'undress this girl', 'change clothes to swimwear')..."
            style={styles.promptTextarea}
            rows="3"
          />
        </div>

        <button
          onClick={() => {
            setPrompt('undress this girl')
            setStatus('idle')
            setError(null)
          }}
          style={styles.buttonSmall}
        >
          Reset Prompt
        </button>
      </div>

      {/* Canvas Drawing Section */}
      {imageSrc && (
        <InpaintCanvas
          imageSrc={imageSrc}
          onExport={handleExport}
          brushSize={20}
          coords={[]} // Will be managed internally
        />
      )}

      {/* Status Messages */}
      {loading && (
        <div style={styles.loading}>
          ⏳ Processing your request... Please wait...
        </div>
      )}

      {status === 'success' && resultImage && (
        <div style={styles.successBox}>
          ✅ Generation Complete!
          <button onClick={handleDownload} style={styles.buttonPrimary}>
            📥 Download Result
          </button>
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          ❌ Error: {error}
        </div>
      )}

      {/* Instructions */}
      {status === 'idle' && imageSrc && (
        <div style={styles.instructions}>
          <h3>How to Use:</h3>
          <ol>
            <li><strong>Upload or paste an image URL</strong> of a character you want to modify.</li>
            <li><strong>Enter your prompt</strong> - e.g., "undress this girl", "change to swimsuit", etc.</li>
            <li><strong>Draw on the clothing areas</strong> in RED using your mouse/finger:</li>
                <ul>
                    <li>Clothes you want removed/changed = draw red lines over them</li>
                    <li>Skin you want to keep = don't draw on it (will remain unchanged)</li>
                </ul>
            <li><strong>Adjust brush size</strong> with the slider for precision.</li>
            <li><strong>Click "Generate Result"</strong> button.</li>
            <li>Fooocus will inpaint only the drawn areas based on your prompt!</li>
          </ol>
        </div>
      )}

      {/* Instructions when no image loaded */}
      {!imageSrc && (
        <div style={styles.instructions}>
          <h3>Step 1: Load Your Image</h3>
          <p>Upload a character image from your device or paste an image URL.</p>
          <p>Once loaded, you'll see it ready for inpainting!</p>
        </div>
      )}
    </div>
  )
}

// Styles object
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px'
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
    alignItems: 'center'
  },
  inputContainer: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  urlInput: {
    padding: '10px',
    width: '400px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px'
  },
  promptSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'center'
  },
  label: {
    fontWeight: 'bold',
    color: '#555'
  },
  promptTextarea: {
    width: '400px',
    padding: '10px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '60px'
  },
  instructions: {
    background: '#f5f5f5',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
    maxWidth: '800px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#e7f3ff',
    borderRadius: '10px',
    marginBottom: '20px'
  },
  successBox: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#d4edda',
    borderRadius: '10px',
    marginBottom: '20px',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  errorBox: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f8d7da',
    borderRadius: '10px',
    marginBottom: '20px'
  },
  buttonPrimary: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  buttonSecondary: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  buttonSmall: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }
}

export default App
