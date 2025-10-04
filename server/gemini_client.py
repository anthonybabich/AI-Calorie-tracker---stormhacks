import os
import logging
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# --- Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("Google Generative AI configured successfully.")
    except Exception as e:
        logger.error(f"Error configuring Google Generative AI: {e}")
        GEMINI_API_KEY = None # Disable if configuration fails
else:
    logger.warning("GEMINI_API_KEY not found. Running in offline/fallback mode.")

# --- Fallback Data ---
FALLBACK_CALORIES = {
    "apple": 95,
    "banana": 105,
    "slice of pizza": 285,
    "hamburger": 354,
    "salad": 150,
}

def _get_fallback_estimate(labels):
    """Provides a deterministic fallback calorie estimate based on simple labels."""
    if not labels:
        return "unknown", 100, 0.1 # Default fallback
    
    primary_label = labels[0].lower()
    for food, calories in FALLBACK_CALORIES.items():
        if food in primary_label:
            return food, calories, 0.5 # Confidence is lower for fallback
    
    return primary_label, 100, 0.1 # Default if no match

def estimate_calories_from_image(image_bytes: bytes, file_name: str) -> dict:
    """
    Estimates calories from an image, using Gemini if available, otherwise a fallback.

    Args:
        image_bytes: The image content as bytes.
        file_name: The original name of the file.

    Returns:
        A dictionary with the estimation result.
    """
    # --- Simple label extraction for fallback ---
    # In a real scenario, a local model or more sophisticated logic could be used.
    simple_labels = [file_name.split('.')[0].replace('_', ' ').replace('-', ' ')]

    if not GEMINI_API_KEY:
        logger.info("Using fallback calorie estimation.")
        food, calories, confidence = _get_fallback_estimate(simple_labels)
        return {
            "ok": True,
            "food": food,
            "calories_est": calories,
            "confidence": confidence,
            "labels": simple_labels,
            "error": None,
        }

    try:
        logger.info("Calling Gemini API for calorie estimation.")
        # TODO: Replace with a multimodal call when the API supports it directly
        # For now, we simulate a text-based call using extracted labels.
        # A more advanced implementation would use a Vision API to get labels first.
        
        model = genai.GenerativeModel('gemini-pro')
        
        # Example prompt structure for Gemini
        prompt = (
            f"Estimate the calories for a food item with the following characteristics. "
            f"Primary label: '{simple_labels[0]}'. "
            f"Provide the food name, estimated calories as an integer, and a confidence score from 0.0 to 1.0. "
            f"Format the response as a simple comma-separated string: food_name,calories,confidence_score"
        )

        response = model.generate_content(prompt)
        
        # --- Parse Gemini's response ---
        # This parsing is fragile and for demonstration purposes.
        # A more robust solution would request JSON output from Gemini.
        parts = response.text.strip().split(',')
        if len(parts) != 3:
            raise ValueError("Unexpected response format from Gemini.")
            
        food_name = parts[0].strip()
        calories_est = int(parts[1].strip())
        confidence = float(parts[2].strip())

        return {
            "ok": True,
            "food": food_name,
            "calories_est": calories_est,
            "confidence": confidence,
            "labels": simple_labels, # In a real app, these would come from a Vision API
            "error": None,
        }

    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}. Falling back to deterministic estimate.")
        # Fallback on API error
        food, calories, confidence = _get_fallback_estimate(simple_labels)
        return {
            "ok": True,
            "food": food,
            "calories_est": calories,
            "confidence": confidence,
            "labels": simple_labels,
            "error": f"Gemini API call failed: {e}",
        }
