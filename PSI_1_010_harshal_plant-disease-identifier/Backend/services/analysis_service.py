import os
from google import genai
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv(override=True)
api_key = os.getenv("GOOGLE_API_KEY")

if api_key:
    client = genai.Client(api_key=api_key)
else:
    print("⚠ GOOGLE_API_KEY not found in .env")
    client = None

def analyze_plant(image_path):
    """Analyze a plant image for disease detection using Gemini."""
    if not client:
        return "Gemini API client not configured."
        
    with open(image_path, "rb") as img:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=["Analyze plant disease and give treatment", img]
        )

    return response.text