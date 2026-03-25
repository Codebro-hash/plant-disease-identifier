import os
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types


def _get_client():
    """
    Create Gemini client per request so updating GOOGLE_API_KEY doesn't require
    restarting the FastAPI server.
    """
    load_dotenv(override=True)
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        # Avoid non-ASCII console output issues on Windows terminals.
        print("WARNING: GOOGLE_API_KEY not found in .env")
        return None
    return genai.Client(api_key=api_key)

def analyze_plant(image_path: str) -> str:
    """Analyze a plant image for disease detection using Gemini."""
    client = _get_client()
    if not client:
        return "Gemini API client not configured."

    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    prompt = (
        "Analyze this plant image and provide:\n"
        "- Disease detection\n"
        "- Pest detection\n"
        "- Health issues\n"
        "- Treatment suggestions\n"
    )

    with open(image_path, "rb") as img:
        image_bytes = img.read()

    # main.py compresses/saves as JPEG, so inline data should be treated as JPEG.
    image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")

    # Retry transient failures (quota/rate-limits/temporary server errors).
    max_retries = 3
    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            response = client.models.generate_content(
                model=model,
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part(text=prompt), image_part],
                    )
                ],
            )

            if response and getattr(response, "text", None):
                return response.text

            # Fallback if SDK returns a response without `.text`
            return f"Analysis failed: Gemini returned no text for model={model}."
        except Exception as e:
            last_error = str(e)
            msg = last_error.upper()

            # Handle quota/rate-limit: wait a bit and retry.
            if "RESOURCE_EXHAUSTED" in msg or "429" in msg:
                # Exponential backoff: 2s, 4s, 8s
                if attempt < max_retries:
                    time.sleep(2 ** attempt)
                    continue

                return (
                    "Analysis failed: Gemini quota exceeded (429 RESOURCE_EXHAUSTED). "
                    "Check your Google AI key billing / limits and try again later."
                )

            print(f"Gemini analysis error (attempt {attempt}): {last_error}")
            return f"Analysis failed: {last_error}"

    return f"Analysis failed: {last_error}"