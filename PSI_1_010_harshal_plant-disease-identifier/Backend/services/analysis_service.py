import os
from google import genai
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv(override=True)
api_key = os.getenv("GOOGLE_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
else:
    print("⚠ GOOGLE_API_KEY not found in .env")

model = genai.GenerativeModel("gemini-2.5-flash")

def analyze_plant(image_path):
    """Analyze a plant image for disease detection using Gemini."""
    with open(image_path, "rb") as img:
        response = model.generate_content(
            ["Analyze plant disease and give treatment", img]
        )

    return response.text