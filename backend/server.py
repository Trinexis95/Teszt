from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# --- Predefined Tags ---
PREDEFINED_TAGS = [
    "villanyszerelés", "csövezés", "burkolás", "festés", 
    "szigetelés", "gipszkarton", "hiba", "javítás",
    "ablak", "ajtó", "fűtés", "klíma", "szaniter"
]

# --- Models ---

class FloorplanModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    name: str
    filename: str = ""
    content_type: str = "image/jpeg"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FloorplanCreate(BaseModel):
    name: str

class FloorplanResponse(BaseModel):
    id: str
    project_id: str
    name: str
    filename: str
    content_type: str
    created_at: str
    marker_count: int = 0

class ImageModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # alapszereles, szerelvenyezes, atadas
    description: str = ""
    filename: str = ""
    content_type: str = "image/jpeg"
    tags: List[str] = []
    location: Optional[dict] = None  # {lat: float, lng: float, address: str}
    linked_image_id: Optional[str] = None  # For before/after comparison
    floorplan_id: Optional[str] = None  # Which floorplan this image is marked on
    floorplan_x: Optional[float] = None  # X position on floorplan (0-100%)
    floorplan_y: Optional[float] = None  # Y position on floorplan (0-100%)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProjectModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    image_count: int = 0

class ProjectCreate(BaseModel):
    name: str
    description: str = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ImageUpdate(BaseModel):
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    location: Optional[dict] = None
    linked_image_id: Optional[str] = None
    floorplan_id: Optional[str] = None
    floorplan_x: Optional[float] = None
    floorplan_y: Optional[float] = None

class ImageResponse(BaseModel):
    id: str
    category: str
    description: str
    filename: str
    content_type: str
    tags: List[str] = []
    location: Optional[dict] = None
    linked_image_id: Optional[str] = None
    floorplan_id: Optional[str] = None
    floorplan_x: Optional[float] = None
    floorplan_y: Optional[float] = None
    created_at: str

class ProjectWithImages(BaseModel):
    id: str
    name: str
    description: str
    created_at: str
    updated_at: str
    image_count: int
    images: List[ImageResponse]
    floorplans: List[FloorplanResponse] = []

# --- Project Endpoints ---

@api_router.get("/")
async def root():
    return {"message": "BauDok API"}

@api_router.get("/tags")
async def get_tags():
    """Get predefined tags list"""
    return {"tags": PREDEFINED_TAGS}

@api_router.post("/projects", response_model=ProjectModel)
async def create_project(project: ProjectCreate):
    project_obj = ProjectModel(
        name=project.name,
        description=project.description
    )
    doc = project_obj.model_dump()
    await db.projects.insert_one(doc)
    return project_obj

@api_router.get("/projects", response_model=List[ProjectModel])
async def get_projects(search: Optional[str] = None):
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nem található")
    
    # Get images for this project (excluding binary data)
    images = await db.images.find(
        {"project_id": project_id},
        {"_id": 0, "data": 0}
    ).sort("created_at", -1).to_list(1000)
    
    # Ensure all images have the new fields
    for img in images:
        if "tags" not in img:
            img["tags"] = []
        if "location" not in img:
            img["location"] = None
        if "linked_image_id" not in img:
            img["linked_image_id"] = None
        if "floorplan_id" not in img:
            img["floorplan_id"] = None
        if "floorplan_x" not in img:
            img["floorplan_x"] = None
        if "floorplan_y" not in img:
            img["floorplan_y"] = None
    
    # Get floorplans for this project
    floorplans = await db.floorplans.find(
        {"project_id": project_id},
        {"_id": 0, "data": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Add marker count to each floorplan
    for fp in floorplans:
        marker_count = await db.images.count_documents({"floorplan_id": fp["id"]})
        fp["marker_count"] = marker_count
    
    return {**project, "images": images, "floorplans": floorplans}

@api_router.put("/projects/{project_id}", response_model=ProjectModel)
async def update_project(project_id: str, update: ProjectUpdate):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nem található")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.projects.update_one({"id": project_id}, {"$set": update_data})
    updated = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return updated

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nem található")
    
    # Delete all images and floorplans for this project
    await db.images.delete_many({"project_id": project_id})
    await db.floorplans.delete_many({"project_id": project_id})
    await db.projects.delete_one({"id": project_id})
    
    return {"message": "Projekt törölve"}

# --- Floorplan Endpoints ---

@api_router.post("/projects/{project_id}/floorplans")
async def upload_floorplan(
    project_id: str,
    file: UploadFile = File(...),
    name: str = Form(...)
):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nem található")
    
    content = await file.read()
    
    floorplan_id = str(uuid.uuid4())
    floorplan_doc = {
        "id": floorplan_id,
        "project_id": project_id,
        "name": name,
        "filename": file.filename,
        "content_type": file.content_type or "image/jpeg",
        "data": base64.b64encode(content).decode('utf-8'),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.floorplans.insert_one(floorplan_doc)
    
    return {
        "id": floorplan_id,
        "project_id": project_id,
        "name": name,
        "filename": file.filename,
        "content_type": floorplan_doc["content_type"],
        "created_at": floorplan_doc["created_at"],
        "marker_count": 0
    }

@api_router.get("/projects/{project_id}/floorplans")
async def get_floorplans(project_id: str):
    floorplans = await db.floorplans.find(
        {"project_id": project_id},
        {"_id": 0, "data": 0}
    ).sort("created_at", -1).to_list(100)
    
    for fp in floorplans:
        marker_count = await db.images.count_documents({"floorplan_id": fp["id"]})
        fp["marker_count"] = marker_count
    
    return floorplans

@api_router.get("/floorplans/{floorplan_id}/data")
async def get_floorplan_data(floorplan_id: str):
    floorplan = await db.floorplans.find_one({"id": floorplan_id})
    if not floorplan:
        raise HTTPException(status_code=404, detail="Tervrajz nem található")
    
    data = base64.b64decode(floorplan["data"])
    return Response(content=data, media_type=floorplan.get("content_type", "image/jpeg"))

@api_router.get("/floorplans/{floorplan_id}/images")
async def get_floorplan_images(floorplan_id: str):
    """Get all images marked on a specific floorplan"""
    images = await db.images.find(
        {"floorplan_id": floorplan_id},
        {"_id": 0, "data": 0}
    ).to_list(1000)
    
    for img in images:
        if "tags" not in img:
            img["tags"] = []
    
    return images

@api_router.delete("/floorplans/{floorplan_id}")
async def delete_floorplan(floorplan_id: str):
    floorplan = await db.floorplans.find_one({"id": floorplan_id})
    if not floorplan:
        raise HTTPException(status_code=404, detail="Tervrajz nem található")
    
    # Remove floorplan references from images
    await db.images.update_many(
        {"floorplan_id": floorplan_id},
        {"$set": {"floorplan_id": None, "floorplan_x": None, "floorplan_y": None}}
    )
    
    await db.floorplans.delete_one({"id": floorplan_id})
    
    return {"message": "Tervrajz törölve"}

# --- Image Endpoints ---

@api_router.post("/projects/{project_id}/images")
async def upload_image(
    project_id: str,
    file: UploadFile = File(...),
    category: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),  # Comma-separated tags
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    address: str = Form(""),
    floorplan_id: Optional[str] = Form(None),
    floorplan_x: Optional[float] = Form(None),
    floorplan_y: Optional[float] = Form(None)
):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nem található")
    
    if category not in ["alapszereles", "szerelvenyezes", "atadas"]:
        raise HTTPException(status_code=400, detail="Érvénytelen kategória")
    
    # Verify floorplan exists if provided
    if floorplan_id:
        floorplan = await db.floorplans.find_one({"id": floorplan_id})
        if not floorplan:
            raise HTTPException(status_code=404, detail="Tervrajz nem található")
    
    # Read file content
    content = await file.read()
    
    # Parse tags
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    
    # Build location object
    location = None
    if lat is not None and lng is not None:
        location = {"lat": lat, "lng": lng, "address": address}
    
    image_id = str(uuid.uuid4())
    image_doc = {
        "id": image_id,
        "project_id": project_id,
        "category": category,
        "description": description,
        "filename": file.filename,
        "content_type": file.content_type or "image/jpeg",
        "data": base64.b64encode(content).decode('utf-8'),
        "tags": tag_list,
        "location": location,
        "linked_image_id": None,
        "floorplan_id": floorplan_id,
        "floorplan_x": floorplan_x,
        "floorplan_y": floorplan_y,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.images.insert_one(image_doc)
    
    # Update project image count
    count = await db.images.count_documents({"project_id": project_id})
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"image_count": count, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "id": image_id,
        "category": category,
        "description": description,
        "filename": file.filename,
        "content_type": image_doc["content_type"],
        "tags": tag_list,
        "location": location,
        "linked_image_id": None,
        "floorplan_id": floorplan_id,
        "floorplan_x": floorplan_x,
        "floorplan_y": floorplan_y,
        "created_at": image_doc["created_at"]
    }

@api_router.get("/projects/{project_id}/images")
async def get_project_images(
    project_id: str,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    query = {"project_id": project_id}
    
    if category:
        query["category"] = category
    
    if tag:
        query["tags"] = tag
    
    if date_from or date_to:
        query["created_at"] = {}
        if date_from:
            query["created_at"]["$gte"] = date_from
        if date_to:
            query["created_at"]["$lte"] = date_to + "T23:59:59"
    
    images = await db.images.find(query, {"_id": 0, "data": 0}).sort("created_at", -1).to_list(1000)
    
    # Ensure all images have the new fields
    for img in images:
        if "tags" not in img:
            img["tags"] = []
        if "location" not in img:
            img["location"] = None
        if "linked_image_id" not in img:
            img["linked_image_id"] = None
        if "floorplan_id" not in img:
            img["floorplan_id"] = None
        if "floorplan_x" not in img:
            img["floorplan_x"] = None
        if "floorplan_y" not in img:
            img["floorplan_y"] = None
    
    return images

@api_router.get("/images/{image_id}/data")
async def get_image_data(image_id: str):
    image = await db.images.find_one({"id": image_id})
    if not image:
        raise HTTPException(status_code=404, detail="Kép nem található")
    
    data = base64.b64decode(image["data"])
    return Response(content=data, media_type=image.get("content_type", "image/jpeg"))

@api_router.put("/images/{image_id}")
async def update_image(image_id: str, update: ImageUpdate):
    image = await db.images.find_one({"id": image_id})
    if not image:
        raise HTTPException(status_code=404, detail="Kép nem található")
    
    update_data = {}
    if update.description is not None:
        update_data["description"] = update.description
    if update.tags is not None:
        update_data["tags"] = update.tags
    if update.location is not None:
        update_data["location"] = update.location
    if update.linked_image_id is not None:
        # Verify the linked image exists
        if update.linked_image_id != "":
            linked = await db.images.find_one({"id": update.linked_image_id})
            if not linked:
                raise HTTPException(status_code=404, detail="Kapcsolt kép nem található")
        update_data["linked_image_id"] = update.linked_image_id if update.linked_image_id else None
    
    # Floorplan position update
    if update.floorplan_id is not None:
        if update.floorplan_id != "":
            floorplan = await db.floorplans.find_one({"id": update.floorplan_id})
            if not floorplan:
                raise HTTPException(status_code=404, detail="Tervrajz nem található")
        update_data["floorplan_id"] = update.floorplan_id if update.floorplan_id else None
    
    if update.floorplan_x is not None:
        update_data["floorplan_x"] = update.floorplan_x
    if update.floorplan_y is not None:
        update_data["floorplan_y"] = update.floorplan_y
    
    if update_data:
        await db.images.update_one({"id": image_id}, {"$set": update_data})
    
    return {"message": "Kép frissítve"}

@api_router.delete("/images/{image_id}")
async def delete_image(image_id: str):
    image = await db.images.find_one({"id": image_id})
    if not image:
        raise HTTPException(status_code=404, detail="Kép nem található")
    
    project_id = image["project_id"]
    
    # Remove any links to this image
    await db.images.update_many(
        {"linked_image_id": image_id},
        {"$set": {"linked_image_id": None}}
    )
    
    await db.images.delete_one({"id": image_id})
    
    # Update project image count
    count = await db.images.count_documents({"project_id": project_id})
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"image_count": count, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Kép törölve"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
