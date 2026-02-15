import os
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from google import genai
from PIL import Image
import hashlib
import io

from database.db import Base, engine, SessionLocal
from models.plant import Plant

# Load env
load_dotenv(override=True)

# Gemini setup
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("⚠ API key missing")
    genai_configured = False
else:
    client = genai.Client(api_key=api_key)
    genai_configured = True
    print("✅ Gemini API configured with google.genai Client")

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Plant Disease API")

def get_image_hash(file_path):
    """Generate a hash for the image to use for caching."""
    hasher = hashlib.md5()
    with open(file_path, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def compress_image(image_path, max_size=(800, 800), quality=85):
    """Compress and resize image to save bandwidth and API tokens."""
    img = Image.open(image_path)
    # Convert to RGB if necessary
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    # Save to a byte buffer to check size
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=quality)
    
    # If it's still too large, we could reduce quality further, but this is usually enough
    return img

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Backend running successfully"}


# ============================
# Upload + Analyze + Save
# ============================
@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    authorization: str = Header(None),
):
    try:
        os.makedirs("uploads", exist_ok=True)
        file_path = f"uploads/{file.filename}"

        # Save image
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. Check for cached analysis first
        image_hash = get_image_hash(file_path)
        db = SessionLocal()
        try:
            cached_plant = db.query(Plant).filter(Plant.image_hash == image_hash).first()
            if cached_plant:
                print(f"♻ Using cached analysis for hash: {image_hash}")
                # Create a new record for this user but copy the analysis
                new_plant = Plant(
                    image_path=file_path,
                    analysis=cached_plant.analysis,
                    image_hash=image_hash,
                    user_id=authorization or "demo-user",
                )
                db.add(new_plant)
                db.commit()
                db.refresh(new_plant)
                return {
                    "success": True,
                    "plant_id": new_plant.id,
                    "analysis": new_plant.analysis,
                    "image": f"/uploads/{file.filename}",
                    "user_id": new_plant.user_id,
                    "cached": True
                }
        finally:
            db.close()

        # 2. Gemini analysis (if not cached)
        if genai_configured:
            from services.analysis_service import analyze_plant
            # Compress image before sending to API
            print(f"📸 Compressing image for analysis")
            compress_image(file_path)
            
            # Use centralized analysis service
            analysis = analyze_plant(file_path)
        else:
            analysis = "Gemini API not configured."

        # 3. Save to DB with hash
        user_id = authorization or "demo-user"
        db = SessionLocal()
        try:
            plant = Plant(
                image_path=file_path,
                analysis=analysis,
                image_hash=image_hash,
                user_id=user_id,
            )
            db.add(plant)
            db.commit()
            db.refresh(plant)
        finally:
            db.close()

        return {
            "success": True,
            "plant_id": plant.id,
            "analysis": analysis,
            "image": f"/uploads/{file.filename}",
            "user_id": user_id,
            "cached": False
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================
# Get Plants (User Filtered)
# ============================
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
                "image": f"/uploads/{os.path.basename(plant.image_path)}",
                "analysis": plant.analysis,
                "user_id": plant.user_id,
                "created_at": plant.created_at,
            }
            for plant in plants
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()

# ============================
# Get Single Plant Detail (Issue 11)
# ============================
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
            "image": f"/uploads/{os.path.basename(plant.image_path)}",
            "analysis": plant.analysis,
            "user_id": plant.user_id,
            "created_at": plant.created_at,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # ============================
# Delete Plant (Issue 12)
# ============================
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

        # Delete image file if exists
        if os.path.exists(plant.image_path):
            os.remove(plant.image_path)

        db.delete(plant)
        db.commit()

        return {"message": "Plant deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()

    from fastapi.responses import Response

# ============================
# Export Plant Markdown
# ============================
@app.get("/plants/{plant_id}/export")
def export_plant_markdown(plant_id: int, authorization: str = Header(None)):
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

        # Markdown content
        markdown = f"""
# 🌱 Plant Analysis Report

## 📸 Image
![Plant Image](/uploads/{os.path.basename(plant.image_path)})

## 🧪 Analysis
{plant.analysis}

## 🕒 Uploaded At
{plant.created_at}

---
Generated by Plant Disease Identifier
"""

        return Response(
            content=markdown,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename=plant-analysis-{plant.id}.md"
            },
        )

    finally:
        db.close()