import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv(override=True)
api_key = os.getenv("GOOGLE_API_KEY")

if api_key:
    client = genai.Client(api_key=api_key)
else:
    print("⚠ GOOGLE_API_KEY not found in .env")
    client = None


def analyze_plant(image_path: str) -> str:
    """Analyze a plant image for disease detection using Gemini."""
    if not client:
        return "Gemini API client not configured."

    try:
        with open(image_path, "rb") as img:
            image_bytes = img.read()

        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type="image/jpeg",  # main.py compresses/saves as JPEG
        )

        prompt = """
        Analyze this plant image:
        - Disease detection
        - Pest detection
        - Health issues
        - Treatment suggestions
        """

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt, image_part],
        )

        if response and getattr(response, "text", None):
            return response.text

        return "Gemini returned an empty response."

    except Exception as e:
        error_msg = str(e)
        print(f"❌ Gemini Analysis Error: {error_msg}")
        return f"Analysis failed: {error_msg}"