import requests
import json
import os

FOOOCUS_URL = "http://127.0.0.1:7865"

def upload_file(file_path):
    """Uploads local image assets to the Fooocus temporary file pool."""
    if not os.path.exists(file_path):
        print(f"❌ Error: Local file not found at {file_path}")
        return None
        
    print(f"Uploading {os.path.basename(file_path)} to Fooocus server...")
    try:
        with open(file_path, "rb") as f:
            files = {"files": f}
            res = requests.post(f"{FOOOCUS_URL}/upload", files=files)
            if res.status_code == 200:
                server_path = res.json()[0]
                print(f"Successfully uploaded. Server path: {server_path}")
                return server_path
            else:
                print(f"❌ Failed to upload file: {res.status_code} - {res.text}")
                return None
    except Exception as e:
        print(f"❌ Exception occurred during upload: {e}")
        return None

def run_generation():
    session_hash = "tinypiumpi123"
    
    # 1. Define your file inputs (Ensure these exist in your working directory)
    src_local = "556.png"
    mask_local = "557.png"
    
    # 2. Upload assets to get valid server-relative paths
    image_path = upload_file(src_local)
    mask_path = upload_file(mask_local)
    
    if not image_path or not mask_path:
        print("🛑 Aborting generation: Image asset uploads were unsuccessful.")
        return

    # 3. Construct the 153-element parameter matrix for Fooocus v2.5.0
    # Ensure this array has exactly 153 elements
    # Ensure this array has exactly 153 elements
    # Ensure this array has exactly 153 elements
    # Wrapping paths in {"name": ...} to satisfy the hijack's type check
    # Use the absolute path as a simple string. 
    # The Hijack will internally handle the file if it's a valid string path.
    # We must also ensure the list is exactly 153 elements.
    
    matrix_data = [
        False, "A cat in space", "bad quality", ["Fooocus V2"], "Quality", 
        "1024×1024", 1, "png", "-1", False, 2, 4, 
        "juggernautXL_v8Rundiffusion.safetensors", "None", 0.5,
        True, "None", -2, True, "None", -2, True, "None", -2, True, "None", -2, True, "None", -2,
        True, "", "Inpaint or Outpaint (modify content)", "", ["Left"],
        str(image_path), "A cat in space", str(mask_path), # <--- Cast to str()
        # Fill the remaining slots to hit 153 total items
        True, True, True, False, 1.5, 0.8, 0.3, 7, 2, 
        "None", "None", "None", 
        *[0]*110, # Fills the remaining 110 positions with 0
        "u2net", "full", "", "", "", "u2net", "full", "", "", "", "u2net", "full", "", "", "", False
    ]
    
    # Add this check to be absolutely sure before sending
    print(f"DEBUG: Current matrix length is {len(matrix_data)}")

    print("\n🚀 Injecting Payload into Generation Pipeline...")
    payload_trigger = {
        "fn_index": 67,
        "data": matrix_data,
        "session_hash": session_hash
    }

    try:
        response = requests.post(f"{FOOOCUS_URL}/api/predict", json=payload_trigger)
        if response.status_code == 200:
            print("✨ Generation successfully triggered without endpoint validation errors!")
            print(f"Backend Server Response: {json.dumps(response.json(), indent=2)}")
            print("\n💡 Note: Look at your running Fooocus server terminal window to watch the generation step percentages.")
            print("The completed inpaint image will save automatically inside your Fooocus 'outputs' subfolder.")
        else:
            print(f"❌ Server returned error code: {response.status_code}")
            print(f"Details: {response.text}")
    except Exception as e:
        print(f"❌ Network connection failure: {e}")

if __name__ == "__main__":
    run_generation()