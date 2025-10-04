import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from . import image_utils, gemini_client

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

# --- Constants ---
MAX_FILE_SIZE = 6 * 1024 * 1024  # 6 MB
ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]

@router.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyzes an uploaded image to estimate calorie content.
    """
    # --- 1. Validate file ---
    if not file.content_type in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Please upload a JPEG, PNG, or WebP image."
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the limit of 6MB."
        )

    # --- 2. Check for blurriness ---
    if image_utils.is_image_blurry(contents):
        return {
            "ok": False,
            "reason": "blurry",
            "message": "Image too blurry—please take another photo."
        }

    # --- 3. Get image metadata ---
    metadata = image_utils.get_image_metadata(contents)
    if not metadata:
        raise HTTPException(status_code=400, detail="Could not process image file.")

    # --- 4. Estimate calories ---
    try:
        result = gemini_client.estimate_calories_from_image(contents, file.filename)
        
        response = {
            "ok": result.get("ok", False),
            "food": result.get("food"),
            "calories_est": result.get("calories_est"),
            "confidence": result.get("confidence"),
            "meta": {
                "labels": result.get("labels", []),
                "image_w": metadata["width"],
                "image_h": metadata["height"],
            }
        }

        if result.get("confidence", 1.0) < 0.6:
            response["advice"] = "low_confidence"

        return response

    except Exception as e:
        logger.error(f"An unexpected error occurred during analysis: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
