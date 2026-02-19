from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

PREDEFINED_TAGS = [
    "villanyszerelés", "csövezés", "burkolás", "festés", 
    "szigetelés", "gipszkarton", "hiba", "javítás",
    "ablak", "ajtó", "fűtés", "klíma", "szaniter"
]

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

def create_id():
    return str(uuid.uuid4())

def now_iso():
    return datetime.now(timezone.utc).isoformat()

@api_router.get("/")
async def root():
    return {"message": "BauDok API"}

@api_router.get("/tags")
async def get_tags():
    return {"tags": PREDEFINED_TAGS}

@api_router.post("/projects")
async def create_project(data: ProjectCreate):
    project = {
        "id": create_id(),
        "name": data.name,
        "description": data.description,
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "image_count": 0
    }
    await db.projects.insert_one(project)
    project.pop("_id", None)
    return project

@api_router.get("/projects")
async def get_projects(search: Optional[str] = None):
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    cursor = db.projects.find(query, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(1000)

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nem található")
    
    images = await db.images.find({"project_id": project_id}, {"_id": 0, "data": 0}).sort("created_at", -1).to_list(1000)
    floorplans = await db.floorplans.find({"project_id": project_id}, {"_id": 0, "data": 0}).sort("created_at", -1).to_list(100)
    
    for fp in floorplans:
        fp["marker_count"] = await db.images.count_documents({"floorplan_id": fp["id"]})
    
    return {**project, "images": images, "floorplans": floorplans}

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, data: ProjectUpdate):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nem található")
    
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.projects.update_one({"id": project_id}, {"$set": update})
    
    updated = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return updated

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nem található")
    
    await db.images.delete_many({"project_id": project_id})
    await db.floorplans.delete_many({"project_id": project_id})
    await db.projects.delete_one({"id": project_id})
    return {"message": "Projekt törölve"}

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
    floorplan = {
        "id": create_id(),
        "project_id": project_id,
        "name": name,
        "filename": file.filename or "floorplan",
        "content_type": file.content_type or "image/jpeg",
        "data": base64.b64encode(content).decode('utf-8'),
        "created_at": now_iso()
    }
    await db.floorplans.insert_one(floorplan)
    
    return {
        "id": floorplan["id"],
        "project_id": project_id,
        "name": name,
        "filename": floorplan["filename"],
        "content_type": floorplan["content_type"],
        "created_at": floorplan["created_at"],
        "marker_count": 0
    }

@api_router.get("/projects/{project_id}/floorplans")
async def get_floorplans(project_id: str):
    floorplans = await db.floorplans.find({"project_id": project_id}, {"_id": 0, "data": 0}).sort("created_at", -1).to_list(100)
    for fp in floorplans:
        fp["marker_count"] = await db.images.count_documents({"floorplan_id": fp["id"]})
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
    images = await db.images.find({"floorplan_id": floorplan_id}, {"_id": 0, "data": 0}).to_list(1000)
    return images

@api_router.delete("/floorplans/{floorplan_id}")
async def delete_floorplan(floorplan_id: str):
    floorplan = await db.floorplans.find_one({"id": floorplan_id})
    if not floorplan:
        raise HTTPException(status_code=404, detail="Tervrajz nem található")
    
    await db.images.update_many(
        {"floorplan_id": floorplan_id},
        {"$set": {"floorplan_id": None, "floorplan_x": None, "floorplan_y": None}}
    )
    await db.floorplans.delete_one({"id": floorplan_id})
    return {"message": "Tervrajz törölve"}

@api_router.post("/projects/{project_id}/images")
async def upload_image(
    project_id: str,
    file: UploadFile = File(...),
    category: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),
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
    
    content = await file.read()
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    location = {"lat": lat, "lng": lng, "address": address} if lat and lng else None
    
    image = {
        "id": create_id(),
        "project_id": project_id,
        "category": category,
        "description": description,
        "filename": file.filename or "image",
        "content_type": file.content_type or "image/jpeg",
        "data": base64.b64encode(content).decode('utf-8'),
        "tags": tag_list,
        "location": location,
        "linked_image_id": None,
        "floorplan_id": floorplan_id if floorplan_id else None,
        "floorplan_x": floorplan_x,
        "floorplan_y": floorplan_y,
        "created_at": now_iso()
    }
    await db.images.insert_one(image)
    
    count = await db.images.count_documents({"project_id": project_id})
    await db.projects.update_one({"id": project_id}, {"$set": {"image_count": count, "updated_at": now_iso()}})
    
    image.pop("data", None)
    image.pop("_id", None)
    return image

@api_router.get("/projects/{project_id}/images")
async def get_project_images(
    project_id: str,
    category: Optional[str] = None,
    tag: Optional[str] = None
):
    query = {"project_id": project_id}
    if category:
        query["category"] = category
    if tag:
        query["tags"] = tag
    
    images = await db.images.find(query, {"_id": 0, "data": 0}).sort("created_at", -1).to_list(1000)
    return images

@api_router.get("/images/{image_id}/data")
async def get_image_data(image_id: str):
    image = await db.images.find_one({"id": image_id})
    if not image:
        raise HTTPException(status_code=404, detail="Kép nem található")
    data = base64.b64decode(image["data"])
    return Response(content=data, media_type=image.get("content_type", "image/jpeg"))

@api_router.put("/images/{image_id}")
async def update_image(image_id: str, data: ImageUpdate):
    image = await db.images.find_one({"id": image_id})
    if not image:
        raise HTTPException(status_code=404, detail="Kép nem található")
    
    update = {}
    if data.description is not None:
        update["description"] = data.description
    if data.tags is not None:
        update["tags"] = data.tags
    if data.location is not None:
        update["location"] = data.location
    if data.linked_image_id is not None:
        update["linked_image_id"] = data.linked_image_id if data.linked_image_id else None
    if data.floorplan_id is not None:
        update["floorplan_id"] = data.floorplan_id if data.floorplan_id else None
    if data.floorplan_x is not None:
        update["floorplan_x"] = data.floorplan_x
    if data.floorplan_y is not None:
        update["floorplan_y"] = data.floorplan_y
    
    if update:
        await db.images.update_one({"id": image_id}, {"$set": update})
    return {"message": "Kép frissítve"}

@api_router.delete("/images/{image_id}")
async def delete_image(image_id: str):
    image = await db.images.find_one({"id": image_id})
    if not image:
        raise HTTPException(status_code=404, detail="Kép nem található")
    
    project_id = image["project_id"]
    await db.images.update_many({"linked_image_id": image_id}, {"$set": {"linked_image_id": None}})
    await db.images.delete_one({"id": image_id})
    
    count = await db.images.count_documents({"project_id": project_id})
    await db.projects.update_one({"id": project_id}, {"$set": {"image_count": count, "updated_at": now_iso()}})
    return {"message": "Kép törölve"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
