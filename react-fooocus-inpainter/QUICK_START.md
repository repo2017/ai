# ⚡ Quick Start Guide - Fooocus Inpainter

Get up and running in 3 minutes!

---

## 📦 Installation (First Time Only)

```bash
cd react-fooocus-inpainter
npm install
```

**That's it!** No complex build steps needed.

---

## 🚀 Run the Project

```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

---

## ✅ Before You Start

Make sure Fooocus is running locally on port 8888:

```bash
# Check if Fooocus API is accessible
curl http://127.0.0.1:8888/health
```

**If you see a response or no error**, you're good to go!

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

## 📝 Example Test Images (for development)

Test your setup with these sample images:

- Lady in clothes: https://images.unsplash.com/photo-1529626455594-450fcdaf548f?w=800
- Another test: https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800

(These are public URLs for quick testing)

---

## 🐛 Troubleshooting Quick Fixes

### "Cannot connect to Fooocus API"
```bash
# Make sure Fooocus is running locally
# If using Docker: docker ps | grep fooocus
# If native binary: ./fooocus or python main.py (check your install docs)
```

### Drawing doesn't show on canvas
- Check if image loaded successfully
- Verify browser console has no errors
- Try refreshing the page

### Image looks stretched after upload
- This is normal - the canvas adapts to screen size
- It maintains proper aspect ratio, just scaled for display
- The mask coordinates are calculated correctly regardless

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

## 📞 Need Help?

- Check console (F12) for errors
- Review `CONTINUE.md` for detailed debugging tips
- Look at project structure: all components are well-commented

---

**Ready?** Start with:

```bash
npm install && npm run dev
```

Then open **http://localhost:3000** and start creating! 🎨✨
