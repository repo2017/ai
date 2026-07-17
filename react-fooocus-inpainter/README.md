# React Fooocus Inpainter - AI Image Undress Tool

A React-based web application that allows you to draw inpainting masks on images and send them to your locally running Fooocus instance for AI image generation.

## 🎯 Features

- **Draw on Images**: Use an interactive canvas to mark areas where you want AI to modify the image
- **Inpainting Integration**: Seamlessly connects to your local Fooocus API (v1)
- **Red Brush Mask System**: Draw in red on clothing areas to indicate what should be changed/undressed
- **Black & White Mask Generation**: Automatically converts your drawings into proper inpainting masks
- **Prompt-Based Generation**: Enter AI prompts to control what the result should look like
- **Local API Integration**: Works with Fooocus running locally on port 8888

## 📋 Prerequisites

1. **Fooocus must be running locally** on `http://127.0.0.1:8888`
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

## 🔧 Usage Instructions

### 1. Start Fooocus Locally

Ensure your Fooocus instance is running and accessible at `http://127.0.0.1:8888`

### 2. Upload or Paste an Image

- Click "Choose Image from Device" to upload a character image
- OR paste an image URL in the text field and click "Load from URL"

### 3. Set Your Prompt

Enter what you want the AI to generate, e.g.:
- `"undress this girl"` 
- `"change clothes to swimsuit"`
- `"remove jacket and show bare shoulders"`

### 4. Draw the Mask

**IMPORTANT**: Draw in **RED** on the areas you want to change!

- Use your mouse or finger (on touch screens)
- Draw over clothing, shoes, hair accessories, etc.
- Do NOT draw on skin or face areas you want to keep unchanged
- Adjust brush size with the slider for precision

### 5. Generate Result

Click "Generate Result" button. The app will:

1. Convert your red strokes into a black & white mask
2. Send it to Fooocus API with your prompt
3. Display the generated image when complete

### 6. Download Your Creation

Once generation is complete, click "Download Result" to save the AI-generated image.

## 🎨 How It Works

1. **Upload Image**: You provide a character/clothing image
2. **Draw Mask**: You draw where changes are wanted (red brush)
3. **Generate Mask**: The app converts red strokes → black & white mask
   - Black = keep as-is
   - White = change according to AI prompt
4. **AI Generation**: Fooocus inpaints ONLY the masked areas
5. **Result**: You get a modified image with your drawings changed

## 📁 Project Structure

```
react-fooocus-inpainter/
├── src/
│   ├── components/
│   │   └── InpaintCanvas.jsx    # Canvas drawing component
│   ├── utils/
│   │   └── fooocusApi.js        # Fooocus API integration
│   ├── App.jsx                  # Main React application
│   ├── main.jsx                 # Entry point
│   └── styles.css               # Styling
├── index.html                   # HTML template
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

## ⚙️ API Configuration

By default, the app connects to Fooocus at: `http://127.0.0.1:8888/api/v1/generation/image-inpaint`

### Custom API URL (Optional)

You can modify the API endpoint in `src/utils/fooocusApi.js`:

```javascript
const FOOOCUS_API_URL = 'http://your-server:PORT/api/v1/generation/image-inpaint'
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

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

## ⚠️ Important Notes

- **Privacy**: Images are processed locally on your machine. The mask and image are only sent to your local Fooocus instance.
- **Internet Required**: Only for downloading large images if using URLs (the AI generation itself can work offline).
- **Performance**: Large images may take longer to process. Consider resizing very large images before uploading.

## 🐛 Troubleshooting

### "Cannot connect to Fooocus API"

1. Make sure Fooocus is running locally
2. Check if port 8888 is accessible: `curl http://127.0.0.1:8888`
3. Verify Fooocus has the correct API endpoint enabled

### "Image failed to load"

- Try a different image format (PNG, JPG preferred)
- For very large images (>5MB), consider resizing them first
- URLs must be accessible and not block cross-origin requests

### Mask generation issues

- Make sure you're drawing on the actual clothing areas, not too close to skin boundaries
- Use the brush size slider for more precise control
- Clear mask with "Clear Mask" button and try again

## 📄 License

This project is created for personal use. Please respect Fooocus licensing terms.

## 💡 Tips

1. **Draw larger strokes** on clothing - you don't need pixel-perfect precision
2. **Don't worry about skin** - the AI will handle edges automatically
3. **Use descriptive prompts** for better results
4. **Save good results** - Fooocus remembers settings you can reuse

---

Made with ❤️ for local AI art creation and digital creativity.
