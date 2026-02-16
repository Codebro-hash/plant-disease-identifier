import os
import shutil
import hashlib
import io

from fastapi import FastAPI, HTTPException, UploadFile, File, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from google import genai
from PIL import Image

from database.db import Base, engine, SessionLocal
from models.plant import Plant

# =========================
# Load ENV
# =========================
load_dotenv(override=True)

api_key = os.getenv("GOOGLE_API_KEY")

if api_key:
    client = genai.Client(api_key=api_key)
    genai_configured = True
    print("✅ Gemini API configured")
else:
    genai_configured = False
    print("⚠ Gemini API key missing")


# =========================
# FastAPI Setup
# =========================
app = FastAPI(title="Plant Disease API")

# CORS (IMPORTANT FOR VERCEL FRONTEND)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to Vercel URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

        # Check cached result
        cached = db.query(Plant).filter(Plant.image_hash == image_hash).first()

        if cached:
            new_plant = Plant(
                image_path=file_path,
                analysis=cached.analysis,
                image_hash=image_hash,
                user_id=authorization or "demo-user",
            )

            db.add(new_plant)
            db.commit()
            db.refresh(new_plant)
            db.close()

            return {
                "success": True,
                "plant_id": new_plant.id,
                "analysis": new_plant.analysis,
                "image": f"/uploads/{file.filename}",
                "cached": True,
            }

        # Gemini analysis
        if genai_configured:
            from services.analysis_service import analyze_plant
            analysis = analyze_plant(file_path)
        else:
            analysis = "Gemini API not configured."

        # Save new record
        plant = Plant(
            image_path=file_path,
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
            "image": f"/uploads/{file.filename}",
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
                "image": f"/uploads/{os.path.basename(plant.image_path)}",
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
            "image": f"/uploads/{os.path.basename(plant.image_path)}",
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

        markdown = f"""
# 🌱 Plant Analysis Report

## 📸 Image
![Plant](/uploads/{os.path.basename(plant.image_path)})

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
