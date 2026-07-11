import os
from pathlib import Path
from typing import List
import urllib.request
import cloudinary
import cloudinary.uploader
import cloudinary.api

CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
API_KEY = os.getenv("CLOUDINARY_API_KEY")
API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

def is_cloudinary_enabled() -> bool:
    return bool(CLOUD_NAME and API_KEY and API_SECRET)

if is_cloudinary_enabled():
    cloudinary.config(
        cloud_name=CLOUD_NAME,
        api_key=API_KEY,
        api_secret=API_SECRET,
        secure=True
    )

def upload_image(file_or_path, public_id: str) -> str:
    response = cloudinary.uploader.upload(
        file_or_path,
        public_id=public_id,
        overwrite=True,
        resource_type="image"
    )
    return response.get("secure_url")

def download_image(url: str, local_path: Path) -> bool:
    try:
        local_path.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(url, str(local_path))
        return True
    except Exception as e:
        print(f"[Error] Failed to download image from {url} to {local_path}: {e}")
        return False

def delete_session_folder(session_id: str) -> bool:
    if not is_cloudinary_enabled():
        return False
    try:
        prefix = f"gemintel/sessions/{session_id}/"
        # Delete all resources under this prefix
        cloudinary.api.delete_resources_by_prefix(prefix)
        
        # Clean up empty folders in Cloudinary (try-except block since API errors on non-existent folders)
        try:
            cloudinary.api.delete_folder(f"gemintel/sessions/{session_id}/uploads")
        except Exception:
            pass
        try:
            cloudinary.api.delete_folder(f"gemintel/sessions/{session_id}/masks")
        except Exception:
            pass
        try:
            cloudinary.api.delete_folder(f"gemintel/sessions/{session_id}")
        except Exception:
            pass
        return True
    except Exception as e:
        print(f"[Error] Failed to delete Cloudinary assets for session {session_id}: {e}")
        return False
