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
FALLBACK_NUTRITION = {
    "apple": {"calories": 95, "carbs_g": 25, "protein_g": 0.5, "fat_g": 0.3},
    "banana": {"calories": 105, "carbs_g": 27, "protein_g": 1.3, "fat_g": 0.4},
    "slice of pizza": {"calories": 285, "carbs_g": 36, "protein_g": 12, "fat_g": 10},
    "hamburger": {"calories": 354, "carbs_g": 40, "protein_g": 25, "fat_g": 16},
    "salad": {"calories": 150, "carbs_g": 10, "protein_g": 3, "fat_g": 10},
}

def _get_fallback_estimate(labels):
    """Provides a deterministic fallback calorie estimate based on simple labels."""
    if not labels:
        return "unknown", 100, 5, 2, 3, 0.1 # Default fallback with macros
    
    primary_label = labels[0].lower()
    for food, nutrition in FALLBACK_NUTRITION.items():
        if food in primary_label:
            return (food, nutrition["calories"], nutrition["carbs_g"], 
                   nutrition["protein_g"], nutrition["fat_g"], 0.5)
    
    return primary_label, 100, 5, 2, 3, 0.1 # Default if no match

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
        food, calories, carbs_g, protein_g, fat_g, confidence = _get_fallback_estimate(simple_labels)
        return {
            "ok": True,
            "food": food,
            "calories_est": calories,
            "carbs_g": carbs_g,
            "protein_g": protein_g,
            "fat_g": fat_g,
            "confidence": confidence,
            "labels": simple_labels,
            "error": None,
        }

    try:
        logger.info("Calling Gemini API for calorie estimation.")
        
        model = genai.GenerativeModel('gemini-flash-latest')
        
        # Convert bytes to PIL Image for Gemini
        from PIL import Image
        import io
        
        image = Image.open(io.BytesIO(image_bytes))
        
        # Create a comprehensive prompt for food analysis
        prompt = (
            "Analyze this food image and provide detailed nutritional information. "
            "Look carefully at the food item(s) in the image and identify what they are. "
            "Provide your response in exactly this format: food_name,calories,carbs_g,protein_g,fat_g,confidence_score "
            "Where food_name is a clear description of the food, calories is an integer estimate, "
            "carbs_g is grams of carbohydrates, protein_g is grams of protein, fat_g is grams of fat, "
            "and confidence_score is between 0.0 and 1.0 representing how confident you are. "
            "Example: chocolate chip cookie,150,20,2,7,0.8 "
            "Be as accurate as possible with standard serving sizes."
        )
        
        # Send both the image and prompt to Gemini
        response = model.generate_content([prompt, image])
        
        # --- Parse Gemini's response ---
        # This parsing is fragile and for demonstration purposes.
        # A more robust solution would request JSON output from Gemini.
        parts = response.text.strip().split(',')
        if len(parts) != 6:
            raise ValueError(f"Unexpected response format from Gemini. Expected 6 parts, got {len(parts)}: {response.text}")
            
        food_name = parts[0].strip()
        calories_est = int(parts[1].strip())
        carbs_g = float(parts[2].strip())
        protein_g = float(parts[3].strip())
        fat_g = float(parts[4].strip())
        confidence = float(parts[5].strip())

        return {
            "ok": True,
            "food": food_name,
            "calories_est": calories_est,
            "carbs_g": carbs_g,
            "protein_g": protein_g,
            "fat_g": fat_g,
            "confidence": confidence,
            "labels": simple_labels, # In a real app, these would come from a Vision API
            "error": None,
        }

    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}. Falling back to deterministic estimate.")
        # Fallback on API error
        food, calories, carbs_g, protein_g, fat_g, confidence = _get_fallback_estimate(simple_labels)
        return {
            "ok": True,
            "food": food,
            "calories_est": calories,
            "carbs_g": carbs_g,
            "protein_g": protein_g,
            "fat_g": fat_g,
            "confidence": confidence,
            "labels": simple_labels,
            "error": f"Gemini API call failed: {e}",
        }
