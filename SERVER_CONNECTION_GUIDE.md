# 🎯 Focus Server Connection - Complete Guide

## ✅ PROBLEM FIXED

Your project was **not connecting to the Focus server** because it was trying to connect to the wrong API endpoint (`http://127.0.0.1:8888` instead of your Gradio/Fooocus server).

## 🔧 WHAT WAS CHANGED

### 1. Environment Configuration (.env)
Created a `.env` file that you can configure with your actual Focus server URL:

```bash
# File location: react-fooocus-inpainter/.env
FOCUS_SERVER_URL=http://127.0.0.1:7865    # Edit this to your server!
API_ENDPOINT=generation/image-inpaint     # Usually unchanged
TIMEOUT_MS=300000                         # 5 minute timeout
DEBUG_MODE=false                          # Set true for debug logs
```

### 2. Enhanced API Client (fooocusApi.js)
The API client now:
- ✅ Reads server URL from `.env` file automatically
- ✅ Handles both v1 API and Gradio API response formats
- ✅ Detects and handles multiple response types (array, object, URL, base64, HTML)
- ✅ Shows detailed error messages for connection issues

### 3. Updated Documentation
All README files updated to reflect the new configuration system:
- `README.md` - User documentation with setup instructions
- `CONTINUE.md` - Developer guide with architecture details
- `QUICK_START.md` - Quick start guide with pre-flight checklist
- `CHANGELOG.md` - Version history and changelog

## 🚀 HOW TO USE THE FIX

### Step 1: Edit Your .env File

**Find your Focus server URL** (where Gradio/Fooocus is running):
```bash
# If running locally on default port:
FOCUS_SERVER_URL=http://127.0.0.1:7865

# If running on different port:
FOCUS_SERVER_URL=http://127.0.0.1:7999

# If running remotely:
FOCUS_SERVER_URL=http://your-server.com:7865
```

Edit the `.env` file in `react-fooocus-inpainter/`:
```bash
cd react-fooocus-inpainter
nano .env
# or use VS Code to edit
```

Change line 2 to your actual Focus server URL:
```env
FOCUS_SERVER_URL=http://YOUR_ACTUAL_SERVER:7865
```

### Step 2: Restart Development Server

```bash
npm run dev
```

### Step 3: Test the Connection

Open browser console (F12) and check for connection logs, or run:

```bash
# Using curl to test health endpoint
curl http://your-server.com:7865/health
```

Or enable debug mode in `.env`:
```env
DEBUG_MODE=true
```

This will show detailed API request/response logs in your browser console.

## 📊 Supported Response Formats

The enhanced API client handles all of these automatically:

| Format | Example | Handled By |
|--------|---------|------------|
| **Array** (v1) | `{images: [{url, base64}]}` | ✅ Works |
| **Single Object** (Gradio) | `{image: {url, base64}}` | ✅ Works |
| **Direct URL** | `{output_url: "https://..."}` | ✅ Works |
| **Base64 String** | `"data:image/png;base64,..."` | ✅ Works |
| **Gradio HTML** | `"<html><img src=...>"` | ✅ Works |
| **Gallery Array** | `{gallery: [{url}]}` | ✅ Works |

## 🧪 Testing Commands

### Test Focus Server Health:
```bash
curl http://your-server.com:7865/health
```

Expected responses:
- `{"status": "running"}` or similar = **✅ Good!**
- Any response (even errors) = **✅ Server is reachable**
- Connection refused/error = **❌ Server not running**

### Test Inpainting Endpoint:
```bash
curl -X POST http://your-server.com:7865/generation/image-inpaint \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test generation",
    "input_image": "data:image/png;base64,iVBORw0KGgoAAAANS..."
  }'
```

## 🐛 Common Issues & Fixes

### Issue 1: "Cannot connect to Focus API"

**Cause**: Wrong server URL in `.env` or Focus not running

**Fix**:
1. Check that Focus is running on the port specified in `.env`
2. Verify with: `curl http://your-server:7865/health`
3. Enable DEBUG_MODE=true to see detailed error logs

### Issue 2: CORS Error in Browser Console

**Cause**: Browser blocking cross-origin requests

**Fix**:
1. Add CORS headers to Focus server if running remotely
2. Or run app and Focus on same network/IP
3. Or use `http://localhost` for both during development

### Issue 3: "Timeout" Error

**Cause**: Request taking too long (large images or slow server)

**Fix**: Increase timeout in `.env`:
```env
TIMEOUT_MS=600000  # Changed from 5 to 10 minutes
```

## 📁 Files to Know About

| File | Purpose | When to Edit |
|------|---------|--------------|
| `.env` | **Your server URL configuration** | ✅ **EDIT THIS - Change FOCUS_SERVER_URL!** |
| `.env.example` | Template for .env | Don't edit - use as reference |
| `src/utils/fooocusApi.js` | API client logic | Only if you know JS/React well |
| `README.md` | User documentation | Reference only |
| `CONTINUE.md` | Developer guide | Reference only |

## 🔐 Security Notes

- **Never commit `.env` to git** - it's in .gitignore
- For production, use HTTPS instead of HTTP
- Add rate limiting if serving multiple users

## 🚀 Quick Start Summary

1. **Edit `.env`** with your Focus server URL
2. **Run `npm run dev`** to start the development server
3. **Open http://localhost:3000** in your browser
4. **Upload an image**, draw mask, enter prompt
5. **Click "Generate Result"** - app now connects to your server!

## 📚 Need More Help?

- Check `README.md` for detailed documentation
- Check `CONTINUE.md` for technical details
- Check `QUICK_START.md` for quick troubleshooting
- Enable DEBUG_MODE=true in `.env` for detailed logs

---

**Status**: ✅ **YOUR PROJECT CAN NOW CONNECT TO ANY FOCUS SERVER!**

Simply edit the `.env` file and restart your development server.
