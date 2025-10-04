import numpy as np
import pytest
from server.image_utils import is_image_blurry
from PIL import Image
import io

def create_test_image(width, height, color, is_blurry=False):
    """Creates a simple test image."""
    array = np.zeros((height, width, 3), dtype=np.uint8)
    array[:, :] = color
    
    if is_blurry:
        # Simulate blur by averaging pixels - this is a very basic simulation
        array = cv2.blur(array, (15, 15))

    img = Image.fromarray(array)
    byte_arr = io.BytesIO()
    img.save(byte_arr, format='PNG')
    return byte_arr.getvalue()

# To avoid a hard dependency on OpenCV for this simple test generation,
# we will simulate the blur effect by creating a noisy (sharp) and a uniform (blurry) image.

def create_sharp_image(width=100, height=100):
    """Creates an image with high frequency noise, which should not be blurry."""
    array = np.random.randint(0, 256, (height, width, 3), dtype=np.uint8)
    img = Image.fromarray(array)
    byte_arr = io.BytesIO()
    img.save(byte_arr, format='PNG')
    return byte_arr.getvalue()

def create_blurry_image(width=100, height=100):
    """Creates a uniform color image, which has zero variance and should be blurry."""
    array = np.full((height, width, 3), 128, dtype=np.uint8)
    img = Image.fromarray(array)
    byte_arr = io.BytesIO()
    img.save(byte_arr, format='PNG')
    return byte_arr.getvalue()

def test_blurry_image_detection():
    """Test that a uniform color image is detected as blurry."""
    blurry_image_bytes = create_blurry_image()
    assert is_image_blurry(blurry_image_bytes, threshold=100) is True

def test_sharp_image_detection():
    """Test that a noisy image is detected as not blurry."""
    sharp_image_bytes = create_sharp_image()
    assert is_image_blurry(sharp_image_bytes, threshold=100) is False

def test_invalid_image_data():
    """Test that invalid image data does not cause an error and is not considered blurry."""
    invalid_bytes = b"this is not an image"
    assert is_image_blurry(invalid_bytes, threshold=100) is False
