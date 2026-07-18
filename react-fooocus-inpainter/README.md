# React Fooocus Inpainter - AI Image Generation Tool

A React-based web application that allows you to draw inpainting masks on images and send them to your locally running Focus (Fooocus/Gradio) instance for AI image generation.

## 🎯 Features

- **Draw on Images**: Use an interactive canvas to mark areas where you want AI to modify the image
- **Inpainting Integration**: Seamlessly connects to your local Focus API (Gradio)
- **Red Brush Mask System**: Draw in red on clothing areas to indicate what should be changed/undressed
- **Black & White Mask Generation**: Automatically converts your drawings into proper inpainting masks
- **Prompt-Based Generation**: Enter AI prompts to control what the result should look like
- **Flexible Server Configuration**: Connects to any Focus server via environment variables

## 📋 Prerequisites

1. **Focus must be running** on your specified server URL (default: `http://127.0.0.1:7865`)
2. Node.js v16+ and npm installed for development
3. A browser with JavaScript enabled (Chrome/Firefox recommended)

## 🚀 Quick Start

### Option 1: Development Mode (Hot Reload)

```bash
cd react-fooocus-inpainter

# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open `http://localhost:3000` in your browser.

### Option 2: Production Build

```bash
cd react-fooocus-inpainter

# Build for production
npm run build
```

This creates optimized files in the `dist/` directory. You can serve this with any static file server, or copy to a web server like Nginx/Apache.

## 🔧 Server Configuration

### Configuring Your Focus Server URL

By default, the app connects to Focus at: `http://127.0.0.1:7865`

You can customize this by creating a `.env` file in the project root:

```bash
# Copy example file first
cp .env.example .env

# Edit .env with your server details
nano .env  # or use your preferred editor
```

Example `.env` content:

```env
# Main Focus Server URL (where Gradio/Fooocus is running)
FOCUS_SERVER_URL=http://your-server:7865

# API Endpoint for inpainting generation
API_ENDPOINT=generation/image-inpaint

# Timeout in milliseconds (default: 300000 / 5 minutes)
TIMEOUT_MS=300000

# Enable debug mode for detailed logging
DEBUG_MODE=false
```

### Connecting to Your Focus Server

1. **Make sure your Focus instance is running** on the specified port and accessible
2. **Update `.env`** with your server URL if different from default
3. **Restart development server**: `npm run dev`
4. **Test connection** in browser console or using `curl`:

```bash
# Test health endpoint
curl http://127.0.0.1:7865/health
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev
```

## 🔌 API Endpoint Configuration (IMPORTANT!)

**The app now uses Gradio/Fooocus API format!**

### Default Endpoints:

- **Main generation**: `http://127.0.0.1:7865/api/predict/65`
- **Fallback v1 endpoint**: `http://127.0.0.1:7865/generation/image-inpaint`

The app automatically uses the Gradio API (fn_index=65) which returns gallery images properly.

### Configure Custom Endpoints:

Edit `src/utils/fooocusApi.js` or set via `.env`:

```javascript
// In src/utils/fooocusApi.js
export let FOOOCUS_FN_INDEX = parseInt(getEnvValue('FOOOCUS_FN_INDEX', '65'), 10);
```

Or use environment variable in `.env`:
```env
FOCUS_SERVER_URL=http://your-server:7865
API_ENDPOINT=generation/image-inpaint  # Optional fallback
FOOOCUS_FN_INDEX=65                     # Main generation endpoint
DEBUG_MODE=true                         # Enable detailed logs
```

See [API_ENDPOINT_FIX.md](./API_ENDPOINT_FIX.md) for complete details on the fix.

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## 📝 Example Prompts

- `"undress this girl"` - Remove clothing items
- `"change to lingerie"` - Change to specific attire  
- `"remove hat and earrings"` - Remove accessories
- `"add swimwear"` - Add swimsuit/clothing
- `"make topless but keep bottom"` - Partial undressing

## ⚙️ API Configuration Details

The app uses environment variables to configure the Focus API connection:

| Variable | Description | Default |
|----------|-------------|---------|
| `FOCUS_SERVER_URL` | Base URL of your Focus server | `http://127.0.0.1:7865` |
| `API_ENDPOINT` | API endpoint path | `generation/image-inpaint` |
| `TIMEOUT_MS` | Request timeout in ms | `300000` (5 min) |
| `DEBUG_MODE` | Enable detailed logging | `false` |

You can also override these settings in `src/utils/fooocusApi.js` directly if needed:

```javascript
const FOCUS_SERVER_URL = 'http://your-server:7865';
const API_ENDPOINT = 'generation/image-inpaint';
```

## 📁 Project Structure

```
react-fooocus-inpainter/
├── src/
│   ├── components/
│   │   └── InpaintCanvas.jsx    # Canvas drawing component
│   ├── utils/
│   │   └── fooocusApi.js        # Focus API integration (supports Gradio)
│   ├── App.jsx                  # Main React application
│   ├── main.jsx                 # Entry point
│   └── styles.css               # Styling
├── .env                         # Environment configuration (gitignored)
├── .env.example                 # Template for environment variables
├── .gitignore                   # Git ignore rules
├── index.html                   # HTML template
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

## 🔌 API Integration Details

### Request Payload Structure

```javascript
{
  prompt: string,                          // User's text prompt
  negative_prompt: "low quality, blurry",  // Negative prompts
  
  input_image: base64_url_string,         // Original image (base64 or URL)
  input_mask: base64_mask_url,            // Black & white mask (white = change area)
  
  u_percentage: 0.6,                      // Denoising strength (0-1)
  inpaint_respective_field: true          // Focus only on masked areas
}
```

### Response Handling

The app handles multiple response formats from Gradio/Fooocus:

- Array of images: `data.images[0].url`
- Single image object: `data.image.url`
- Direct URL: `data.output_url`
- Base64 string directly
- Gradio HTML responses with embedded images

## 🐛 Troubleshooting

### "Cannot connect to Focus API"

1. **Check Focus is running**: Verify your Focus instance is running and accessible
2. **Check server address**: Update `.env` with correct Focus server URL
3. **Test port accessibility**: `curl http://your-server:7865/health`
4. **Enable DEBUG_MODE** in `.env` to see detailed request logs

```bash
# Test connection from command line
curl -X POST http://127.0.0.1:7865/generation/image-inpaint \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test",
    "input_image": "...",
    "input_mask": "..."
  }'
```

### "Image failed to load"

- Try a different image format (PNG, JPG preferred)
- For very large images (>5MB), consider resizing them first
- URLs must be accessible and not block cross-origin requests
- Check browser console for CORS errors

### Mask generation issues

- Make sure you're drawing on the actual clothing areas, not too close to skin boundaries
- Use the brush size slider for more precise control
- Clear mask with "Clear Mask" button and try again

### Connection Timeout

- Large images may take longer - increase TIMEOUT_MS in `.env`
- Try breaking image into smaller sections first
- Check network/firewall settings

## ⚠️ Important Notes

- **Privacy**: Images are processed locally on your machine. The mask and image are only sent to your local Focus instance.
- **Internet Required**: Only for downloading large images if using URLs (the AI generation itself can work offline).
- **Performance**: Large images may take longer to process. Consider resizing very large images before uploading.
- **CORS**: Ensure your Focus server allows cross-origin requests from `http://localhost:3000`

## 📄 License

This project is created for personal use. Please respect Fooocus/Fooocus licensing terms.

## 💡 Tips

1. **Draw larger strokes** on clothing - you don't need pixel-perfect precision
2. **Don't worry about skin** - the AI will handle edges automatically
3. **Use descriptive prompts** for better results
4. **Save good results** - Focus remembers settings you can reuse
5. **Check browser console (F12)** during generation to see API requests and responses

---

Made with ❤️ for local AI art creation and digital creativity.
