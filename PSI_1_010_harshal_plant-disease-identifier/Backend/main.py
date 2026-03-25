import os
import shutil
import hashlib
import io

from fastapi import FastAPI, HTTPException, UploadFile, File, Header, Response
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from google import genai
from PIL import Image

from database.db import Base, engine, SessionLocal
from models.plant import Plant

try:
    import cloudinary
    import cloudinary.uploader
except Exception:
    cloudinary = None

# =========================
# Load ENV
# =========================
load_dotenv(override=True)

api_key = os.getenv("GOOGLE_API_KEY")

if api_key:
    client = genai.Client(api_key=api_key)
    genai_configured = True
    print("Gemini API configured")
else:
    genai_configured = False
    print("WARNING: Gemini API key missing")


# =========================
# FastAPI Setup
# =========================
app = FastAPI(title="Plant Disease API")

# CORS (IMPORTANT FOR VERCEL FRONTEND)
cors_origins_env = (os.getenv("CORS_ORIGINS") or "*").strip()
if cors_origins_env == "*":
    cors_allow_origins = ["*"]
else:
    cors_allow_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allow_origins,
    # Browsers disallow credentials with wildcard origins, so keep this safe by default.
    allow_credentials=(cors_allow_origins != ["*"]),
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Cloudinary (Optional)
# =========================
def _cloudinary_configured() -> bool:
    if cloudinary is None:
        return False
    if os.getenv("CLOUDINARY_URL"):
        return True
    return bool(
        os.getenv("CLOUDINARY_CLOUD_NAME")
        and os.getenv("CLOUDINARY_API_KEY")
        and os.getenv("CLOUDINARY_API_SECRET")
    )


CLOUDINARY_ENABLED = _cloudinary_configured()

if CLOUDINARY_ENABLED and cloudinary is not None and not os.getenv("CLOUDINARY_URL"):
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True,
    )


def upload_image_to_cloudinary(local_file_path: str, image_hash: str) -> str:
    """
    Upload an image file to Cloudinary and return a public URL.
    Uses image_hash as public_id to dedupe/overwrite identical uploads.
    """
    if cloudinary is None:
        raise RuntimeError("Cloudinary SDK not installed")

    folder = os.getenv("CLOUDINARY_FOLDER") or "plant-disease"
    uploaded = cloudinary.uploader.upload(
        local_file_path,
        folder=folder,
        public_id=image_hash,
        overwrite=True,
        resource_type="image",
    )
    return uploaded.get("secure_url") or uploaded.get("url")


def public_image_value(stored_image_path: str) -> str:
    """Return the value the frontend should use in <img src=...>."""
    if not stored_image_path:
        return stored_image_path
    if stored_image_path.startswith("http://") or stored_image_path.startswith("https://"):
        return stored_image_path
    # If we stored a local path like "uploads/foo.jpg", expose it as "/uploads/foo.jpg"
    return f"/uploads/{os.path.basename(stored_image_path)}"

# =========================
# Create DB Tables
# =========================
Base.metadata.create_all(bind=engine)

# Ensure uploads folder exists
os.makedirs("uploads", exist_ok=True)

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# =========================
# Helper Functions
# =========================
def get_image_hash(file_path):
    hasher = hashlib.md5()
    with open(file_path, "rb") as f:
        hasher.update(f.read())
    return hasher.hexdigest()


def compress_image(image_path):
    """Resize + compress image safely (Render compatible)."""
    img = Image.open(image_path)

    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    img.thumbnail((800, 800))

    # overwrite compressed image
    img.save(image_path, "JPEG", quality=85)


# =========================
# Root
# =========================
@app.get("/")
async def root():
    return {"message": "Backend running successfully"}

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "gemini_configured": bool(genai_configured),
        "cloudinary_enabled": bool(CLOUDINARY_ENABLED),
    }


# =========================
# Upload Image + Analysis
# =========================
@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    authorization: str = Header(None),
):
    try:
        file_path = f"uploads/{file.filename}"

        # Save image
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Compress image (fix Render PIL issue)
        compress_image(file_path)

        image_hash = get_image_hash(file_path)

        db = SessionLocal()

        # Check cached result (use most recent first so an earlier failure doesn't block later success)
        cached = (
            db.query(Plant)
            .filter(Plant.image_hash == image_hash)
            .order_by(Plant.id.desc())
            .first()
        )
        cache_is_usable = bool(
            cached
            and cached.analysis
            and not str(cached.analysis).startswith("Analysis failed:")
            and "not configured" not in str(cached.analysis).lower()
        )

        # Determine image URL/path to store
        image_to_store = None
        if CLOUDINARY_ENABLED:
            # If a cached record already points to a Cloudinary URL, reuse it.
            if cached and cached.image_path and (
                cached.image_path.startswith("http://") or cached.image_path.startswith("https://")
            ):
                image_to_store = cached.image_path
            else:
                image_to_store = upload_image_to_cloudinary(file_path, image_hash=image_hash)
        else:
            image_to_store = file_path

        if cache_is_usable:
            new_plant = Plant(
                image_path=image_to_store,
                analysis=cached.analysis,
                image_hash=image_hash,
                user_id=authorization or "demo-user",
            )

            db.add(new_plant)
            db.commit()
            db.refresh(new_plant)

            # If Cloudinary is enabled, free local storage even when we reuse cached analysis.
            if CLOUDINARY_ENABLED and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass

            db.close()

            return {
                "success": True,
                "plant_id": new_plant.id,
                "analysis": new_plant.analysis,
                "image": public_image_value(new_plant.image_path),
                "cached": True,
            }

        # Gemini analysis
        if genai_configured:
            from services.analysis_service import analyze_plant
            analysis = analyze_plant(file_path)
        else:
            analysis = "Gemini API not configured."

        # If using Cloudinary, we don't need local file persistence on the server.
        # Delete only AFTER analysis to avoid breaking local-file analysis.
        if CLOUDINARY_ENABLED and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

        # Save new record
        plant = Plant(
            image_path=image_to_store,
            analysis=analysis,
            image_hash=image_hash,
            user_id=authorization or "demo-user",
        )

        db.add(plant)
        db.commit()
        db.refresh(plant)
        db.close()

        return {
            "success": True,
            "plant_id": plant.id,
            "analysis": analysis,
            "image": public_image_value(plant.image_path),
            "cached": False,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# Get Plants
# =========================
@app.get("/plants")
def get_plants(authorization: str = Header(None)):
    db = SessionLocal()

    try:
        user_id = authorization or "demo-user"

        plants = (
            db.query(Plant)
            .filter(Plant.user_id == user_id)
            .order_by(Plant.id.desc())
            .all()
        )

        return [
            {
                "id": plant.id,
                "image": public_image_value(plant.image_path),
                "analysis": plant.analysis,
                "user_id": plant.user_id,
                "created_at": plant.created_at,
            }
            for plant in plants
        ]

    finally:
        db.close()


# =========================
# Get Single Plant
# =========================
@app.get("/plants/{plant_id}")
def get_single_plant(plant_id: int, authorization: str = Header(None)):
    db = SessionLocal()

    try:
        user_id = authorization or "demo-user"

        plant = (
            db.query(Plant)
            .filter(Plant.id == plant_id, Plant.user_id == user_id)
            .first()
        )

        if not plant:
            raise HTTPException(status_code=404, detail="Plant not found")

        return {
            "id": plant.id,
            "image": public_image_value(plant.image_path),
            "analysis": plant.analysis,
            "created_at": plant.created_at,
        }

    finally:
        db.close()


# =========================
# Delete Plant
# =========================
@app.delete("/plants/{plant_id}")
def delete_plant(plant_id: int, authorization: str = Header(None)):
    db = SessionLocal()

    try:
        user_id = authorization or "demo-user"

        plant = (
            db.query(Plant)
            .filter(Plant.id == plant_id, Plant.user_id == user_id)
            .first()
        )

        if not plant:
            raise HTTPException(status_code=404, detail="Plant not found")

        # Best-effort local cleanup (Cloudinary URLs won't exist on disk)
        if plant.image_path and not (
            plant.image_path.startswith("http://") or plant.image_path.startswith("https://")
        ):
            if os.path.exists(plant.image_path):
                os.remove(plant.image_path)

        db.delete(plant)
        db.commit()

        return {"message": "Plant deleted successfully"}

    finally:
        db.close()


# =========================
# Export Markdown
# =========================
@app.get("/plants/{plant_id}/export")
def export_markdown(plant_id: int, authorization: str = Header(None)):
    db = SessionLocal()

    try:
        user_id = authorization or "demo-user"

        plant = (
            db.query(Plant)
            .filter(Plant.id == plant_id, Plant.user_id == user_id)
            .first()
        )

        if not plant:
            raise HTTPException(status_code=404, detail="Plant not found")

        image_for_md = public_image_value(plant.image_path)
        markdown = f"""
# 🌱 Plant Analysis Report

## 📸 Image
![Plant]({image_for_md})

## 🧪 Analysis
{plant.analysis}

## Uploaded
{plant.created_at}
"""

        return Response(
            content=markdown,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename=plant-{plant.id}.md"
            },
        )

    finally:
        db.close()


# =========================
# Random Quote (used by frontend QuoteGenerator)
# =========================
@app.get("/random-quote")
def random_quote():
    try:
        quote = "Healthy soil grows healthy plants."
        if genai_configured:
            prompt = (
                "Give one short inspirational quote about farming, plants, or gardening. "
                "Return only the quote text, no author, no quotes."
            )
            resp = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )
            if resp and getattr(resp, "text", None):
                quote = resp.text.strip().splitlines()[0].strip()

        # Keep response shape compatible with existing frontend code:
        # QuoteGenerator expects: data.data.quote
        return {"data": {"quote": quote}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Backward-compatible alias (matches Backend/README.md)
@app.get("/api/random-quote")
def random_quote_api():
    return random_quote()
