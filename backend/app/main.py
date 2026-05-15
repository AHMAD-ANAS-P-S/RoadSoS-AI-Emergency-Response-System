"""
RoadSoS — FastAPI Backend
Handles: AI triage API, service search, SOS coordination, data sync
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import sos, services, auth
from app.core.config import settings
from app.core.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="RoadSoS API",
    description="AI-Powered Emergency Response Backend",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sos.router,      prefix="/api/sos",      tags=["SOS"])
app.include_router(services.router, prefix="/api/services", tags=["Services"])
app.include_router(auth.router,     prefix="/api/auth",     tags=["Auth"])

@app.get("/")
async def root():
    return { "name": "RoadSoS API", "version": "1.0.0", "status": "operational",
             "message": "Every second counts. Every life matters." }

@app.get("/health")
async def health():
    return { "status": "healthy" }
