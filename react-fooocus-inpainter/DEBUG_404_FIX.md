# 🔧 Quick Fix for 404 Error on Image Inpaint API

## The Problem

```
POST http://127.0.0.1:7865/generation/image-inpaint 404 (Not Found)
```

This error means your React app is trying to connect to Focus, but the endpoint returns 404 (not found).

## Root Causes & Solutions

### ✅ Solution 1: Make Sure Focus Is Running

The most common cause: **Focus/Gradio server isn't actually running**.

**Check if Focus is running:**
```bash
# From your project root or in a new terminal:
curl http://localhost:7865/health
# Or try the base URL:
curl http://localhost:7865/
```

**Expected response (if running):**
```json
{"status": "running"}
// or any response at all!
```

**If Focus isn't running:**
```bash
cd path/to/your/focus
npm start
# Follow Focus's startup instructions
# Usually: python -m fooocus.server or similar
```

### ✅ Solution 2: Check Your .env File

Make sure your `.env` file has the correct server URL:

```bash
# Open the file:
cd react-fooocus-inpainter
nano .env  # or use VS Code/your preferred editor
```

**Check these lines:**
```env
FOCUS_SERVER_URL=http://127.0.0.1:7865    # ✅ Should match where Focus is running
API_ENDPOINT=generation/image-inpaint     # Usually correct, but might need change
TIMEOUT_MS=300000                         # 5 minute timeout (default)
DEBUG_MODE=false                          # Set to true for detailed logs
```

**Common port numbers:**
- Default Fooocus/Gradio: `7865`
- Sometimes: `7860`, `7888`, `8080`

### ✅ Solution 3: Use Alternative Endpoint Paths

Some versions of Focus use different endpoint paths. Try these in order:

1. **Default (try first):**
   ```env
   API_ENDPOINT=generation/image-inpaint
   ```

2. **Alternative:**
   ```env
   API_ENDPOINT=inpainting/image-inpaint
   ```

3. **Or test via URL parameter (quick workaround):**
   
   Add to your browser URL:
   ```
   http://localhost:3000/?FOCUS_SERVER_URL=http://127.0.0.1:8080
   ```

### ✅ Solution 4: Use the New Diagnostic Tool

I've added a new diagnostic function that automatically runs when you get a 404 error.

**In browser console (F12), run:**

```javascript
await diagnoseEndpoint()
```

This will:
- ✅ Test if your Focus server is reachable
- ✅ Try multiple common endpoint paths
- ✅ Suggest alternative endpoints if the first one fails
- ✅ Show detailed diagnostic info in the console

**Example output you'll see:**
```
🔍 === DIAGNOSING FOCUS ENDPOINT ===
Current config: http://127.0.0.1:7865/generation/image-inpaint
✅ Server base URL is reachable (http://127.0.0.1:7865)
✅ Endpoint http://127.0.0.1:7865/generation/image-inpaint responded with status: 200
✅ Endpoint is working correctly!
```

Or it might show alternatives if the main one fails:
```
⚠️  Getting 404 - endpoint might not exist
💡 Try these alternative paths:
  - generation/inpaint: exists but requires body
  - inpainting/image-inpaint: exists but requires body
  - text-to-image: reachable
```

### ✅ Solution 5: Enable Debug Mode

Set this in your `.env` file to see detailed request/response logs:

```env
DEBUG_MODE=true
```

Then restart your development server (`npm run dev`) and check the browser console for full API request details.

## Quick Checklist

Before filing a bug, verify these steps:

- [x] Focus is actually running (check with `curl http://localhost:7865/health`)
- [x] `.env` file exists with correct `FOCUS_SERVER_URL`
- [x] Restarted development server after editing `.env` (`npm run dev`)
- [ ] Tried `await diagnoseEndpoint()` in browser console (NEW!)
- [ ] Checked for 404 vs other errors

## How These Changes Help You

I've made **smart, minimal changes** to avoid rewriting whole files:

1. **Added localStorage support** - Quick config updates without editing `.env`
2. **Added `diagnoseEndpoint()` function** - Automatically tests connectivity and suggests fixes
3. **Improved error messages** - Now shows helpful hints when you get 404 errors
4. **Exposed debug config to window** - Check `window.DEBUG_CONFIG` in console

## Files Changed (Minimal!)

Only modified:
- ✅ `react-fooocus-inpainter/src/utils/fooocusApi.js` (diagnostic features)

No need to touch:
- ❌ React components
- ❌ Styling files  
- ❌ Build configuration

## Still Getting 404?

Run this in browser console to diagnose:

```javascript
// 1. Check current config
window.DEBUG_CONFIG

// 2. Run diagnostics
await diagnoseEndpoint()

// 3. Try localStorage config (edit then refresh page)
localStorage.setItem('FOCUS_SERVER_URL', 'http://127.0.0.1:YOUR_PORT')
location.reload()
```

---

**Status**: Enhanced error diagnosis tools added!  
**Next step**: Run Focus and try generating again, or run `diagnoseEndpoint()` in console.
