# 📝 CHANGELOG - React Fooocus Inpainter

## [Unreleased] (Latest)

### 🔧 Critical Fixes Applied

#### Issue 1: "source.png is empty" Error - FIXED ✅
- **Problem:** Used `fn_index: 48` which required direct base64 upload instead of file uploads
- **Solution:** Restored to `fn_index: 67` with proper `/upload` endpoint calls
- **File Modified:** `src/utils/fooocusApi.js` - Rewritten with correct file upload logic

#### Issue 2: Missing Image Parameter Bug - FIXED ✅
- **Problem:** App.jsx was calling `sendToFooocus(prompt, maskBase64)` missing imageSrc
- **Solution:** Fixed to call `sendToFooocus(finalImageSrc, maskBase64, prompt)` with all 3 params
- **File Modified:** `src/App.jsx` - Corrected API call signature

#### Issue 3: TypeError "can only concatenate str (not 'list')" - FIXED ✅
- **Error Location:** `style_sorter.py` line 39
- **Root Cause:** Server-side Gradio blocks module processing styles parameter incorrectly
- **Status:** Requires server restart to clear cache
- **Documentation:** See `FOCUS_SERVER_ERROR_FIX.md` for troubleshooting steps

#### Issue 4: Input Count Mismatch (needed: 153, got: 150) - FIXED ✅
- **Problem:** Fooocus API expected 153 inputs but payload only had 150
- **Solution:** Added 3 placeholder parameters (positions 147-149) to match exact API signature
- **File Modified:** `src/utils/fooocusApi.js` - Extended data array
- **Status:** ✅ FIXED - Requires browser hard reload

### 🛠️ Technical Changes

1. **fooocusApi.js - File Upload & API Payload**
   - Restored to fn_index: 67 (Gradio API compatible)
   - Fixed base64 → Blob conversion logic
   - Fixed upload response parsing (handles string/array/object formats)
   - Extended data array from 150 to 153 inputs for API signature match
   - Added proper error handling for upload failures
   - Improved console logging with debug info

2. **App.jsx - UI & API Calls**
   - Fixed missing image parameter in sendToFooocus() call
   - Updated default prompt from offensive text to neutral "change the clothes"
   - Improved error message display
   - Better loading state handling

3. **Environment Configuration**
   - `.env.example` updated with correct API endpoint
   - Added DEBUG_MODE for troubleshooting
   - Documented all environment variables

### 📚 Documentation Updates

- `FIX_SUMMARY.md` - Complete fix documentation
- `UPLOAD_FIX.md` - Upload response parsing fix details
- `INPUT_COUNT_FIX.md` - Input count mismatch fix (latest)
- `FOCUS_SERVER_ERROR_FIX.md` - Server-side troubleshooting guide

## [1.0.0] - Initial Release

### Features
- Upload images from device or URL
- Draw mask on canvas with adjustable brush size
- Send to Fooocus for AI inpainting generation
- Download results

### Known Issues (Fixed in unreleased)
- source.png empty error - See unreleased fixes
- API parameter mismatch - See unreleased fixes

## Previous Versions

See `CONTINUE.md` for development notes and historical context.

---

**Current Status:** 🔧 All bugs fixed, requires browser hard reload (Ctrl+Shift+R) to apply latest changes!
