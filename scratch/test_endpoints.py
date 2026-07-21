import requests
import io
from PIL import Image
import numpy as np

# Create a random noise image
img = Image.fromarray(np.random.randint(0, 255, (300, 300, 3), dtype=np.uint8))
img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='PNG')
img_byte_arr.seek(0)

# 1. Test /authenticate (Faceted Gem flow)
print("Testing /authenticate...")
try:
    res = requests.post(
        "http://127.0.0.1:8000/authenticate",
        files={"file": ("noise.png", img_byte_arr, "image/png")}
    )
    print("Status code:", res.status_code)
    print("Response JSON:", res.json())
except Exception as e:
    print("Request failed:", e)

# 2. Test /api/cut/upload (Rough Gem flow)
print("\nTesting /api/cut/upload...")
img_byte_arr.seek(0)
# We need to upload between 8 and 16 images for the rough gem upload
files = [
    ("images", (f"noise_{i}.png", io.BytesIO(img_byte_arr.getvalue()), "image/png"))
    for i in range(8)
]
try:
    res = requests.post(
        "http://127.0.0.1:8000/api/cut/upload",
        data={"gem_type": "blue_sapphire", "weight_ct": 1.5},
        files=files
    )
    print("Status code:", res.status_code)
    print("Response JSON:", res.json())
except Exception as e:
    print("Request failed:", e)
