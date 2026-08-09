import modal
import os

# Define Modal container image with Python 3.11 and backend dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "libimage-exiftool-perl")
    .pip_install_from_requirements("requirements.txt")
)

app = modal.App("gemintel-backend")


@app.function(
    image=image,
    timeout=600,
    secrets=[
        modal.Secret.from_dict(
            {
                "HF_MODEL_REPO": os.getenv("HF_MODEL_REPO", "dmCoder/gemintel-models"),
                "VALUATION_N_JOBS": "1",
            }
        )
    ],
)
@modal.asgi_app()
def fastapi_app():
    from app.main import app as web_app

    return web_app
