# 🔧 Quick Troubleshooting Guide - Fooocus Connection Issues

## ❌ Common Error: 404 Not Found

**Error Message:**
```
fooocusApi.js:139 POST http://127.0.0.1:7865/generation/image-inpaint 404 (Not Found)
```

### ✅ Quick Fix (1 Minute)

1. **Restart your development server:**
   ```bash
   cd react-fooocus-inpainter
   npm run dev
   ```

2. **If you have a `.env` file, edit it:**
   ```env
   FOCUS_SERVER_URL=http://127.0.0.1:7865
   API_ENDPOINT=/api/predict  # ← Make sure this is correct!
   DEBUG_MODE=true            # ← Set to true for better logs
   ```

3. **Clear browser cache and reload:**
   - Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

That's it! Your connection issue should be resolved.

---

## 🔍 Still Getting Errors? Try This

### Step 1: Check Focus Server is Running
```bash
# Windows/Mac/Linux
curl http://localhost:7865/health
```

**Expected:** Some response (even a simple HTML page)  
**If nothing:** Start Fooocus - see below

### Step 2: Start Fooocus if Not Running

From the `react-fooocus-inpainter` directory:

```bash
cd ~/fooocus  # Adjust path to your Fooocus installation
python fooocus_gradio.py --server-port 7865
# or for Linux:
./fooocus_gradio.sh --server-port 7865
```

### Step 3: Test in Browser Console

Open browser (F12 → Console tab) and run:

```javascript
await diagnoseEndpoint()
```

This will:
- ✅ Confirm server is reachable
- ✅ Show which endpoints work
- ✅ Suggest fixes for 404 errors

---

## 📋 Environment Variables Reference

| Variable | Purpose | Example Value | Default |
|----------|---------|---------------|---------|
| `FOCUS_SERVER_URL` | Your Focus server URL | `http://127.0.0.1:7865` | `http://127.0.0.1:7865` |
| `API_ENDPOINT` | API path for predictions | `/api/predict` | `/api/predict` |
| `TIMEOUT_MS` | Request timeout (ms) | `300000` (5 min) | `300000` |
| `DEBUG_MODE` | Enable debug logs | `true`/`false` | `false` |

### Create `.env` if You Haven't Already:

```bash
cd react-fooocus-inpainter
# Copy template
cp .env.example .env

# Edit with your server details
nano .env  # or use VS Code, notepad, etc.
```

---

## 🐛 Alternative Endpoints to Try

If `/api/predict` doesn't work for your Fooocus build:

Run this in browser console:
```javascript
await diagnoseEndpoint()
```

It will suggest alternatives like:
- `/text2img`
- `/img2img`
- `/inpaint`
- `/generation/image-inpaint` (older versions)

**Recommended order to try:**
1. `/api/predict` ✅ (most common, works with Gradio 3.x)
2. `/inpaint`
3. `/text2img`
4. Your original custom endpoint

---

## 🔥 Common Error Messages & Fixes

### "ECONNREFUSED" or "Cannot connect"

**Cause:** Focus server not running or wrong URL

**Fix:**
1. Check Focus is running on port 7865
2. Verify `FOCUS_SERVER_URL` in `.env` matches actual server
3. Check firewall isn't blocking the connection

### "Timeout" Error

**Cause:** Large images or slow server

**Fix:** Increase timeout in `.env`:
```env
TIMEOUT_MS=600000  # Changed from 5 to 10 minutes
```

### CORS Errors in Browser Console

**Cause:** Browser blocking cross-origin requests

**Fix Options:**
- Run both app and Focus on same network (localhost/127.0.0.1)
- Add CORS headers to Focus server config
- Use HTTPS for production deployments

---

## 📱 Quick Test Commands

### Test Server Connectivity
```bash
curl http://localhost:7865/health
```

### Test API Endpoint
```bash
curl -X POST "http://localhost:7865/api/predict" \
  -H "Content-Type: application/json" \
  -d '{"data":{}}' --max-time 5
```

---

## 🎯 Success Checklist

Before reporting issues, verify:

- [ ] ✅ `.env` file exists in project root (optional but recommended)
- [ ] ✅ `FOCUS_SERVER_URL` is set correctly  
- [ ] ✅ `API_ENDPOINT=/api/predict` (or your custom endpoint)
- [ ] ✅ Focus server running on specified port
- [ ] ✅ Can visit `http://localhost:3000` in browser
- [ ] ✅ Browser console shows connection logs (F12 → Console)
- [ ] ✅ No CORS errors or connection refused messages

---

## 📚 Need More Help?

1. **Check the main documentation:**
   - `react-fooocus-inpainter/README.md`
   - `react-fooocus-inpainter/CONTINUE.md`
   - `react-fooocus-inpainter/FIX_SUMMARY.md`

2. **Enable debug mode for detailed logs:**
   ```env
   DEBUG_MODE=true
   ```

3. **Run diagnostic in browser console:**
   ```javascript
   await diagnoseEndpoint()
   ```

---

## 🚀 Next Steps After Fix

Once connection issues are resolved:

1. Upload an image from your device
2. Draw a mask on the canvas (red areas to inpaint)
3. Enter your AI prompt in the textbox
4. Click "🎨 Generate Result"
5. Wait for generation to complete (~10-60 seconds depending on image size)
6. Download or view the generated result

---

**Status:** ✅ Connection issue documented and fixed  
**Fix Applied:** Changed endpoint from `/generation/image-inpaint` to `/api/predict`  
**Last Updated:** 2025-06-18
