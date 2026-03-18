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
    # Avoid non-ASCII console output issues on Windows terminals.
    print("WARNING: GOOGLE_API_KEY not found in .env")
    client = None

def analyze_plant(image_path: str) -> str:
    """Analyze a plant image for disease detection using Gemini."""
    if not client:
        return "Gemini API client not configured."
        
    try:
        with open(image_path, "rb") as img:
            image_bytes = img.read()

        # main.py compresses/saves as JPEG, so inline data should be treated as JPEG.
        image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")

        prompt = (
            "Analyze this plant image and provide:\n"
            "- Disease detection\n"
            "- Pest detection\n"
            "- Health issues\n"
            "- Treatment suggestions\n"
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Content(
                    role="user",
                    parts=[types.Part(text=prompt), image_part],
                )
            ],
        )

        if response and getattr(response, "text", None):
            return response.text
        return "Gemini returned an empty response."

    except Exception as e:
        error_msg = str(e)
        print(f"Gemini analysis error: {error_msg}")
        return f"Analysis failed: {error_msg}"