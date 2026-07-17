# ⚡ Quick Start Guide - Fooocus Inpainter (Gradio/Focus Server)

Get up and running in 3 minutes!

---

## 📦 Installation (First Time Only)

```bash
cd react-fooocus-inpainter
npm install
```

**That's it!** No complex build steps needed.

---

## 🔧 Step 0: Configure Your Focus Server (IMPORTANT!)

Before running the app, you need to tell it where your Focus server is running.

### Option 1: Using Environment Variables (RECOMMENDED)

```bash
# Create .env file from example
cp .env.example .env

# Edit with your server details
nano .env  # or use VS Code/other editor
```

**Edit `.env`**:
```env
FOCUS_SERVER_URL=http://127.0.0.1:7865    # Your Focus server URL
API_ENDPOINT=generation/image-inpaint     # API endpoint (usually unchanged)
TIMEOUT_MS=300000                         # Timeout in ms
DEBUG_MODE=false                          # Set to true for detailed logs
```

**Save and exit**, then continue with installation.

### Option 2: Modify Code Directly

Edit `src/utils/fooocusApi.js`:
```javascript
const FOCUS_SERVER_URL = 'http://your-server:7865';  // Update this!
const API_ENDPOINT = 'generation/image-inpaint';     // Usually unchanged
```

---

## 🚀 Run the Project

```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

---

## ✅ Verify Focus Server Connection

Before you start using the app, verify your Focus server is running and accessible:

```bash
# Check if Focus API is accessible at configured port
curl http://127.0.0.1:7865/health
```

**Expected response**: You should see some response (even an error shows it's reachable).

### If using a remote server:

```bash
curl http://your-focus-server.com:7865/health
```

### Test the actual inpainting endpoint:

```bash
curl -X POST http://127.0.0.1:7865/generation/image-inpaint \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test",
    "input_image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "input_mask": "data:image/png;base64,AGFzbQEAAA..."
  }'
```

---

## 🎨 Using the App (5-Step Process)

### Step 1: Upload an Image

- Click **"Choose Image from Device"** button
- Select a character/clothing image from your computer
- OR paste an image URL and click "Load from URL"

### Step 2: Enter Your Prompt

- In the text box, type what you want to generate
- Example prompts:
  - `"undress this girl"`
  - `"change to swimsuit"`
  - `"remove jacket and show bare shoulders"`
- Click **"Reset Prompt"** to use the default

### Step 3: Draw on the Image

- **Use your mouse** (or touch on mobile)
- **Draw in RED** on areas you want changed
- Adjust brush size with the slider below canvas
- Draw over: clothing, accessories, shoes, etc.
- Don't draw on face/skin you want to keep

### Step 4: Generate Result

- Click **"🎨 Generate Result"** button
- Wait for processing (may take 10-60 seconds)

### Step 5: Download Your Creation

- When generation completes, green success box appears
- Click **"📥 Download Result"** to save the image

---

## 🔄 Typical Workflow

```bash
# Session starts fresh
npm run dev
→ Browser opens at http://localhost:3000

# Upload first image
Click button → Choose file → Image loads

# Draw mask
Draw red on clothing areas

# Generate
Enter prompt "change to swimsuit"
Click "Generate Result"

# Done!
Download result, repeat with next image
```

---

## 🔧 Troubleshooting Quick Fixes

### "Cannot connect to Focus API"

**Solution**: 
1. Check that `.env` has correct `FOCUS_SERVER_URL`
2. Verify Focus is running: `curl http://your-server:7865/health`
3. Enable DEBUG_MODE=true in `.env` and restart server
4. Check browser console (F12) for connection errors

```bash
# Quick fix: ensure .env file exists and has correct URL
cat .env | grep FOCUS_SERVER_URL
```

### Drawing doesn't show on canvas

- Check if image loaded successfully
- Verify browser console has no errors
- Try refreshing the page

### Image looks stretched after upload

- This is normal - the canvas adapts to screen size
- It maintains proper aspect ratio, just scaled for display
- The mask coordinates are calculated correctly regardless

### API Timeout Error

**Solution**: Increase timeout in `.env`:
```env
TIMEOUT_MS=600000  # Changed from 300000 (5 min) to 10 min
```

---

## 🌐 Connecting to Remote Focus Server

If your Focus server is not on localhost:

### Option A: Update .env
```bash
# Edit the .env file
FOCUS_SERVER_URL=http://your-focus-server.com:7865
```

### Option B: Test Connection First
```bash
curl -I http://your-focus-server.com:7865/health
```

### Important for Remote Servers:
- Ensure CORS is enabled on Focus server
- Check firewall rules allow connections from your IP
- Verify SSL certificates are valid (use HTTPS if available)

---

## 📝 Example Test Images (for development)

Test your setup with these sample images:

- Lady in clothes: https://images.unsplash.com/photo-1529626455594-450fcdaf548f?w=800
- Another test: https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800

(These are public URLs for quick testing)

---

## 💾 What Gets Stored

**During session:**
- Uploaded images (in browser memory)
- Generated results (shown in success box)
- Drawing history (can clear anytime)

**Files NOT stored automatically:**
- No server-side storage
- Images cleared on page refresh
- Results cleared when you close the tab

**To persist images**, you'd need to add:
- File system storage
- Database
- Or export to separate folder (coming in next features!)

---

## 🎯 Next Steps After Basics

Once you're comfortable with the core functionality, see `CONTINUE.md` for:

1. Adding image validation
2. Implementing undo/redo
3. Adding preset prompts dropdown
4. Building a queue system for multiple images
5. Extending to mobile apps or PWAs

---

## 🔍 Debugging Tips

### View API Request Details

Enable debug mode in `.env`:
```env
DEBUG_MODE=true
```

Then check browser console (F12) to see:
- Full API payloads being sent
- Response formats from Focus
- Connection errors with details

### Common Debug Commands

```bash
# Check environment variables
cat .env

# Test API connection
curl http://127.0.0.1:7865/health -v

# View node processes
ps aux | grep node

# Check if port is in use
lsof -i :3000
```

---

## 📞 Need Help?

- Check console (F12) for errors
- Review `CONTINUE.md` for detailed debugging tips
- Look at project structure: all components are well-commented
- Enable DEBUG_MODE=true in `.env` for detailed logs

---

**Ready?** Start with:

```bash
npm install && npm run dev
```

Then open **http://localhost:3000** and start creating! 🎨✨

---

## ✅ Pre-flight Checklist

Before using the app, verify:

- [ ] `.env` file exists in project root
- [ ] `FOCUS_SERVER_URL` is set correctly in `.env`
- [ ] Focus server is running and accessible at configured URL
- [ ] Port 3000 is not in use (or Vite has different port)
- [ ] Browser console shows no connection errors on load
- [ ] DEBUG_MODE=false for production, true for development

---

**Pro Tip**: Keep DEBUG_MODE=true while developing to catch connection issues early!
