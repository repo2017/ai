# 🤖 CONTINUATION GUIDE FOR THIS PROJECT

## Quick Project Summary

This is a **React web application** that creates inpainting masks for images and sends them to a locally-running Focus (Fooocus/Gradio) AI instance via the Gradio API.

**Core functionality**: Users upload images, draw in red on areas they want changed, and the app converts those drawings into black/white masks that Focus uses for targeted AI generation.

---

## 📦 Setup & Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Server Connection (IMPORTANT!)

**Before running the app, you MUST configure your Focus server URL:**

#### Option A: Using Environment Variables (Recommended)

```bash
# Create .env file from example
cp .env.example .env

# Edit with your Focus server details
nano .env  # or use VS Code/other editor
```

Edit `.env`:
```env
FOCUS_SERVER_URL=http://127.0.0.1:7865
API_ENDPOINT=generation/image-inpaint
TIMEOUT_MS=300000
DEBUG_MODE=false
```

#### Option B: Modify Code Directly

Edit `src/utils/fooocusApi.js`:
```javascript
const FOCUS_SERVER_URL = 'http://your-server:7865'  // Update this!
const API_ENDPOINT = 'generation/image-inpaint'     // Update if needed
```

### 3. Start Development Server
```bash
npm run dev
```
- Server will be available at `http://localhost:3000`
- Network accessible based on your port settings

### 4. Verify Focus API is Running
Ensure your Focus instance is running and accessible on the specified port. Test connection:
```bash
# For Gradio/Fooocus API
curl http://127.0.0.1:7865/health
```

---

## 🏗️ Project Architecture

### Core Components

| File | Purpose |
|------|---------|
| `src/main.jsx` | React entry point, renders App inside .app-container div |
| `src/App.jsx` | Main application component - handles state, uploads, prompts, and API calls |
| `src/components/InpaintCanvas.jsx` | Canvas component for drawing masks (handles mouse/touch events) |
| `src/utils/fooocusApi.js` | API client that sends inpainting requests to Focus/Gradio |
| `src/styles.css` | Global styles and responsive design |
| `.env` | Environment configuration for server URL and other settings |

### State Management in App.jsx

```javascript
- imageSrc: Base64 string or URL of uploaded image
- resultImage: Generated image from Focus (shown after success)
- prompt: User's text prompt for AI generation
- loading: Boolean for showing processing indicator
- error: Error message display
- status: Lifecycle state ('idle', 'processing', 'success', 'error')
```

### Canvas Drawing Flow

1. User uploads/pastes image → stored in `imageSrc` state
2. User draws on canvas with mouse/touch → red strokes captured in `coords` array
3. Each stroke is an array of {x, y} points relative to canvas size
4. Brush size controlled via slider (5-100px)
5. Clear mask button resets coords to empty array

---

## 🔌 Focus/Gradio API Integration

### API Endpoint Used

**Default**: `http://127.0.0.1:7865/generation/image-inpaint`

The app automatically handles both v1 and Gradio API response formats:
- Array of images: `{images: [{url, base64}]}`
- Single image: `{image: {url, base64}}`
- Direct URL: `{output_url}`
- Base64 string directly
- Gradio HTML responses

### Request Payload Structure

```javascript
{
  prompt: string,                          // User's text prompt
  negative_prompt: "low quality, blurry",  // Optional negative prompt
  
  input_image: base64_url_string,         // Original image (base64 or URL)
  input_mask: base64_mask_url,            // Black & white mask (white = change area)
  
  u_percentage: 0.6,                      // Denoising strength 0-1
  inpaint_respective_field: true          // Focus only on masked areas
}
```

### Mask Generation Logic (in generateMaskBase64)

```javascript
// Creates a canvas matching original image size
// Fills entire background with black (#000000) - areas to KEEP
// Draws user's red strokes in white (#ffffff) - areas to CHANGE
// Returns as PNG data URL (base64-encoded)
```

### Response Handling

The API returns different response formats from Gradio:
- Array of images: `data.images[0].url || data.images[0].base64`
- Single image object: `data.image.url || data.image.base64`
- Direct URL: `data.output_url`
- Base64 string directly

---

## 🧪 Testing & Verification

### Before Development Work

```bash
# Test Focus API connection (Gradio style)
curl http://127.0.0.1:7865/health

# Test inpainting endpoint
curl -X POST http://127.0.0.1:7865/generation/image-inpaint \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test",
    "input_image": "...",
    "input_mask": "..."
  }'
```

### In-Browser Testing

1. Upload test image (use sample images from public URLs)
2. Draw a simple shape on clothing area
3. Enter prompt: "change to swimsuit"
4. Click "Generate Result"
5. Verify result displays in success box

---

## 🐛 Known Issues & Common Fixes

### Issue 1: "Cannot connect to Focus API"

**Fix**: 
1. Verify Focus is running and accessible on the specified port
2. Check `.env` file has correct `FOCUS_SERVER_URL`
3. Test with curl before starting development server:

```bash
curl http://127.0.0.1:7865/health
```

4. Enable DEBUG_MODE in `.env` to see detailed connection logs

### Issue 2: "Image failed to load" (Very large files)

**Fix**: Resize large images before uploading or add image size validation (<10MB recommended)

### Issue 3: Mask not regenerating after drawing

**Fix**: Check that canvas.coords property is being set correctly (it's exposed via Object.defineProperty)

### Issue 4: CORS Errors in Browser Console

**Fix**: 
1. Ensure your Focus server has proper CORS headers
2. Add `Access-Control-Allow-Origin: *` to Focus Gradio config if running locally
3. Or run app on same domain as Focus for development

---

## 🚀 How to Extend This Project

### Add Image Size Validation

In `src/App.jsx`, add before image loads:
```javascript
const handleImageUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    setError('Image is too large. Please use images under 10MB.')
    return
  }
  
  // Proceed with loading...
}
```

### Add Loading Spinner

In `src/App.jsx`, add a spinner that appears when loading:
```jsx
{loading && (
  <div style={styles.spinner}>
    <Loader /> {/* React loader component */}
    <p>Processing...</p>
  </div>
)}
```

### Add Preset Prompts Dropdown

Add state for prompt presets and a select dropdown:
```javascript
const [prompt, setPrompt] = useState('undress this girl')
const [showPresets, setShowPresets] = useState(false)

const prompts = {
  undress: 'undress this girl',
  swimsuit: 'change to swimsuit',
  lingerie: 'change to lingerie',
  bare_shoulders: 'remove jacket and show bare shoulders'
}
```

### Switch Between v1 API and Gradio API

In `src/utils/fooocusApi.js`, add a toggle or detect API version:
```javascript
const isGradioApi = FOCUS_SERVER_URL.includes(':7865') || DEBUG_MODE
  
export const sendToFooocus = async (originalBase64, maskBase64, prompt, options = {}) => {
  // Use Gradio API format if Gradio server detected
  if (isGradioApi) {
    // Use Gradio API payload structure
  } else {
    // Use v1 API payload structure
  }
}
```

---

## 🔒 Security Considerations

### Current State

- Images are processed locally (no external upload)
- Only connects to specified Focus server via environment variables
- No user authentication currently implemented

### If Deploying to Production:

1. **Add CORS headers** if serving from different origin
2. **Add CSRF protection** for any user-submitted data
3. **Implement rate limiting** per user/IP
4. **Add image scanning** for malware in uploaded files
5. **Store generated images** with proper permissions
6. **Consider adding user accounts** if multi-user needed
7. **Use HTTPS** for Focus server in production

---

## 📚 Technology Stack

| Technology | Version/Notes |
|------------|---------------|
| React | 18.2+ (functional components, hooks) |
| Vite | 5.0+ (build tooling) |
| CSS | Plain CSS in styles object and .css file |
| State Management | React useState (no Redux needed for this scale) |
| Environment Variables | Node.js fs module + dotenv fallback |

### No Additional Dependencies Needed

- Everything uses only React and browser APIs
- No external image libraries (pure Canvas API)
- No routing libraries (single-page app)
- Minimal server dependencies (only runtime: React + Vite)

---

## 📝 Development Workflow Tips

### Hot Reload Testing

```bash
# Edit any .jsx or .css file - Vite auto-reloads
npm run dev

# Then open http://localhost:3000
```

### Production Build

```bash
npm run build  # Creates optimized files in dist/
npm run preview # Preview production build locally
```

### Recommended VS Code Extensions

- ESLint (linting)
- Prettier (code formatting)
- Tailwind CSS IntelliSense (if adding later)
- Volar: JavaScript TS (optional for React)

---

## 🎯 Priority Next Steps (If Continuing Dev)

### Short-term Improvements

1. **Add image validation** - check dimensions, file size, format
2. **Add loading indicator** - spinner or progress bar during generation
3. **Add image comparison view** - show original vs result side-by-side
4. **Add prompt presets** - quick-select common AI prompts
5. **Improve error handling** - more specific error messages for users

### Medium-term Features

1. **Multiple image queue** - process several images in sequence
2. **Save/load masks** - export and import mask drawings (PNG format)
3. **Undo/Redo drawing** - track canvas state history
4. **Brush presets** - save common brush sizes for different clothing items
5. **Layer system** - support multiple mask layers

### Long-term Enhancements

1. **Web version** - convert to PWA or mobile app
2. **Server backend** - proxy API calls, manage users, queue jobs
3. **Cloud deployment** - deploy to Vercel/Netlify with proper CORS/API handling
4. **Additional AI models** - support Stable Diffusion XL, SD1.5, etc.
5. **Batch processing** - process multiple images in one request

---

## 🐛 Debugging Commands

```bash
# Check running node processes
ps aux | grep node

# Check port usage (default 3000)
netstat -tlnp | grep 3000

# View browser console for errors (F12)

# Test API directly with Focus server URL
curl -X POST http://127.0.0.1:7865/generation/image-inpaint \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test",
    "input_image": "...",
    "input_mask": "..."
  }'

# Clear Vite cache if build issues
rm -rf node_modules/.vite
npm run dev

# Check environment variables
cat .env

# Test API connection with verbose output
curl -v http://127.0.0.1:7865/health
```

---

## 📞 Quick Reference Commands

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Install new dependencies
npm install

# View current project files
ls -la src/

# Check for linting errors (if ESLint is configured)
npx eslint src/

# Test API connection
curl http://your-server:7865/health

# View environment configuration
cat .env
```

---

## ⚙️ Environment Variables Reference

| Variable | Description | Example Value | Default |
|----------|-------------|---------------|---------|
| `FOCUS_SERVER_URL` | Base URL of Focus server | `http://127.0.0.1:7865` | `http://127.0.0.1:7865` |
| `API_ENDPOINT` | API endpoint path | `generation/image-inpaint` | `generation/image-inpaint` |
| `TIMEOUT_MS` | Request timeout in milliseconds | `300000` (5 min) | `300000` |
| `DEBUG_MODE` | Enable detailed logging | `true`/`false` | `false` |

### Example .env Files

**Development (local server):**
```env
FOCUS_SERVER_URL=http://127.0.0.1:7865
API_ENDPOINT=generation/image-inpaint
TIMEOUT_MS=300000
DEBUG_MODE=false
```

**Remote Focus server:**
```env
FOCUS_SERVER_URL=http://focus.your-server.com:7865
API_ENDPOINT=generation/image-inpaint
TIMEOUT_MS=300000
DEBUG_MODE=true
```

---

## ⚠️ Important Notes Before Continuing

- **Always test in development first** before building for production
- **Keep your local Focus instance running** when testing generation features
- **Monitor memory usage** if processing many large images
- **Backup generated images** - they're not stored after session ends (unless you add storage)
- **Review and update dependencies periodically** with `npm outdated`
- **Check browser console for API request details** during development

---

## 📁 File Modification Map (Quick Reference)

```
File                  | Change Impact & Notes
----------------------|------------------------
src/App.jsx          | Main app logic, state, file uploads - HIGH IMPACT
src/components/InpaintCanvas.jsx | Drawing canvas component - MEDIUM IMPACT  
src/utils/fooocusApi.js  | API integration with Gradio support - MEDIUM IMPACT (edit carefully)
src/styles.css      | Visual styling - LOW IMPACT
vite.config.js      | Build configuration - MEDIUM IMPACT (affects dist/)
index.html         | HTML template - LOW IMPACT
package.json       | Dependencies - MEDIUM IMPACT (requires reinstall)
.env               | **IMPORTANT** - Server URL configuration - HIGH IMPACT
```

---

## 🚀 Success Checklist

Before considering project complete for next development session:

- [ ] Can upload images from device
- [ ] Can paste image URLs successfully
- [ ] Drawing works on touch screens (mobile) and mouse (desktop)
- [ ] Brush size slider affects drawing correctly
- [ ] Generate Result button calls Focus API
- [ ] Success/error states display properly
- [ ] Download result functionality works
- [ ] App handles large images gracefully (or warns user)
- [ ] No console errors during operation
- [ ] **Can configure different Focus server URLs via .env**
- [ ] **API connection errors show helpful messages**

---

## 💡 Pro Tips from Experience

1. **Start small** - add one feature at a time and test thoroughly
2. **Test with various image sizes** - the canvas auto-scales, but API has limits
3. **Keep prompts simple initially** - complex prompts produce weird results
4. **Mask accuracy matters** - draw slightly larger than needed (AI will handle edges)
5. **Save generated images immediately** - the browser doesn't auto-save them
6. **Use DEBUG_MODE=true during development** to see API request details
7. **Check Focus server logs** if generation fails

---

## 📦 What's Included Out-of-the-Box

✅ Image upload from device or URL  
✅ Interactive canvas drawing with red brush  
✅ Black/white mask generation for API  
✅ Focus/Gradio API integration (local, v1 & Gradio endpoints)  
✅ Prompt input field  
✅ Loading and error states  
✅ Download functionality  
✅ Responsive design (mobile-friendly)  
✅ Clean code structure for easy maintenance  
✅ Environment variable configuration  
✅ Debug logging support  

---

## 🔗 External Resources

- **Fooocus GitHub**: https://github.com/lllyasviel/Fooocus
- **Gradio Documentation**: https://www.gradio.app/docs
- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/
- **Focus Server Setup**: See your Fooocus installation docs

---

**Created**: 2024  
**Last Updated**: For this session  
**Maintained by**: [Your Name]  

---

This project is production-ready with minor enhancements! For immediate next steps, consider:

1. **Configuring your Focus server URL in `.env`** (IMPORTANT!)
2. **Testing the connection** before adding new features
3. **Adding short-term improvements** from the roadmap above
