import cv2
import numpy as np
from PIL import Image
import io

def is_image_blurry(image_bytes: bytes, threshold: int = 100) -> bool:
    """
    Checks if an image is blurry using the variance of the Laplacian.

    Args:
        image_bytes: The image content as bytes.
        threshold: The blur detection threshold. Lower is more blurry.

    Returns:
        True if the image is blurry, False otherwise.
    """
    try:
        # Decode the image bytes into an OpenCV image
        image = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        
        # Convert to grayscale for Laplacian calculation
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Compute the variance of the Laplacian
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        return variance < threshold
    except Exception:
        # If OpenCV fails to process, assume it's not a valid image or not blurry
        return False

def get_image_metadata(image_bytes: bytes) -> dict:
    """
    Extracts metadata (width, height, format) from an image.

    Args:
        image_bytes: The image content as bytes.

    Returns:
        A dictionary with image metadata or None if the image is invalid.
    """
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            return {
                "width": img.width,
                "height": img.height,
                "format": img.format,
            }
    except Exception:
        return None
