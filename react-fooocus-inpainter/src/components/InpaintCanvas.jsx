import React, { useRef, useState, useEffect } from 'react'

const InpaintCanvas = ({ imageSrc, onExport, brushSize = 20 }) => {
  const canvasRef = useRef(null)
  const [coords, setCoords] = useState([]) // Store drawing paths
  const [isDrawing, setIsDrawing] = useState(false) // Track if user is currently drawing
  const imgRef = useRef(null) // Store loaded image reference
  
  // Initialize canvas and draw the background image
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageSrc) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Create and load image
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = imageSrc
    
    img.onload = () => {
      // Adjust canvas size to match image aspect ratio
      canvas.width = img.width
      canvas.height = img.height
      imgRef.current = img // Store loaded image for redraw function
      ctx.drawImage(img, 0, 0)
      redraw()
    }
    
    img.onerror = () => {
      console.error('Failed to load image')
    }
  }, [imageSrc])

  // Redraw the image and the semi-transparent mask overlay
  const redraw = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    
    // Check if image is loaded
    if (!imgRef.current) {
      console.log('Image not loaded yet, skipping redraw')
      return
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw base image (use the cached reference)
    ctx.drawImage(imgRef.current, 0, 0)

    // Draw the mask overlay (semi-transparent red so user sees where they draw)
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    coords.forEach((stroke) => {
      if (stroke.length < 1) return
      ctx.beginPath()
      ctx.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y)
      }
      ctx.stroke()
    })
  }

  // Get coordinates relative to the actual canvas size
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    
    const rect = canvas.getBoundingClientRect()
    
    // Calculate scale factors
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    return { x, y }
  }

  // Mouse/Touch events for drawing
  const startDrawing = (e) => {
    const pos = getCanvasCoords(e)
    if (!pos) return
    
    const newStroke = [pos]
    setCoords([...coords, newStroke])
    setIsDrawing(true)
    
    // Redraw to show the stroke immediately
    redraw()
  }

  const draw = (e) => {
    if (!isDrawing) return
    const pos = getCanvasCoords(e)
    if (!pos) return
    
    const newCoords = [...coords]
    const lastStroke = newCoords[newCoords.length - 1]
    lastStroke.push(pos)
    setCoords(newCoords)
    
    // Redraw to show the stroke immediately
    redraw()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    redraw() // Final redraw after stopping
  }

  const clearMask = () => {
    setCoords([])
    redraw()
  }

  // Generate the high-contrast black & white mask for the API
  const generateMaskBase64 = () => {
    const canvas = canvasRef.current
    if (!canvas) return null
    
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = canvas.width
    maskCanvas.height = canvas.height
    const mCtx = maskCanvas.getContext('2d')

    if (!mCtx) return null

    // 1. Fill background with black (areas to keep)
    mCtx.fillStyle = '#000000'
    mCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)

    // 2. Draw the mask strokes in pure white (areas to change)
    mCtx.strokeStyle = '#ffffff'
    mCtx.lineWidth = brushSize
    mCtx.lineCap = 'round'
    mCtx.lineJoin = 'round'

    coords.forEach((stroke) => {
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

  // Handle export button click
  const handleExport = () => {
    const maskBase64 = generateMaskBase64()
    if (!maskBase64) return
    
    onExport({ 
      original: imageSrc, 
      mask: maskBase64,
      coords: coords,
      brushSize: brushSize
    })
  }

  // Internal refs for external control
  const brushSizeRef = useRef(brushSize)
  
  // Expose methods to parent component (without using Object.defineProperty on null canvas)
  const setCoordsExternally = (newCoords) => {
    setCoords(newCoords)
    redraw()
  }
  
  const setBrushSizeExternally = (size) => {
    brushSizeRef.current = size
    redraw()
  }

  // Safe property access for parent component
  Object.defineProperty(window, '_inpaintCanvas_setCoordsExternally', {
    value: setCoordsExternally,
    writable: true,
    configurable: true
  })
  
  Object.defineProperty(window, '_inpaintCanvas_setBrushSizeExternally', {
    value: setBrushSizeExternally,
    writable: true,
    configurable: true
  })

  return (
    <div style={styles.canvasContainer}>
      {/* Canvas wrapper with cursor */}
      <div 
        style={styles.canvasWrapper} 
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={(e) => startDrawing(e.touches[0])}
        onTouchMove={(e) => {
            e.preventDefault() // Prevent scrolling
            draw(e.touches[0])
        }}
        onTouchEnd={stopDrawing}
      >
        {/* Canvas element */}
        <canvas
          ref={canvasRef}
          style={styles.canvas}
        />
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <label style={styles.label}>
          Brush Size:
          <input
            type="range"
            min="5"
            max="100"
            value={brushSize}
            onChange={(e) => {
              const newSize = Number(e.target.value)
              brushSizeRef.current = newSize
              setBrushSizeExternally(newSize)
            }}
            style={styles.slider}
          />
        </label>

        <button 
          onClick={clearMask} 
          className="btn-secondary"
          style={styles.buttonSecondary}
          disabled={coords.length === 0}
        >
          Clear Mask
        </button>

        <button 
          onClick={handleExport} 
          className="btn-primary"
          style={styles.buttonPrimary}
        >
          🎨 Generate Result
        </button>
      </div>

      {/* Instructions overlay */}
      <div style={styles.instructions}>
        <strong>Draw in RED on areas you want to change:</strong><br/>
        This will generate a mask for Fooocus inpainting.
      </div>
    </div>
  )
}

// Styles object (can be moved to CSS if needed) - Dark Mode Design
const styles = {
  canvasContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px'
  },
  canvasWrapper: {
    border: '2px solid #4a5568',
    borderRadius: '8px',
    cursor: 'crosshair',
    backgroundColor: '#1a202c',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  },
  canvas: {
    maxWidth: '100%',
    height: 'auto',
    display: 'block',
    boxShadow: 'none'
  },
  controls: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: '#2d3748',
    padding: '15px',
    borderRadius: '8px'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 'bold',
    color: '#e2e8f0'
  },
  slider: {
    cursor: 'pointer'
  },
  buttonSecondary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#e53e3e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  buttonPrimary: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#38a169',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
  },
  instructions: {
    textAlign: 'center',
    padding: '10px 20px',
    backgroundColor: '#2d3748',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '14px'
  }
}

export default InpaintCanvas
