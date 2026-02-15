import os
<<<<<<< HEAD
from google import genai
=======
import google.generativeai as genai
>>>>>>> main
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv(override=True)
api_key = os.getenv("GOOGLE_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
else:
    print("⚠ GOOGLE_API_KEY not found in .env")

<<<<<<< HEAD
model = genai.GenerativeModel("gemini-2.5-flash")
=======
model = genai.GenerativeModel("gemini-1.5-flash")
>>>>>>> main

def analyze_plant(image_path):
    """Analyze a plant image for disease detection using Gemini."""
    with open(image_path, "rb") as img:
        response = model.generate_content(
            ["Analyze plant disease and give treatment", img]
        )

    return response.text