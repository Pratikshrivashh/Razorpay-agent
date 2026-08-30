import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db import db
from .synthetic_generator import generate_dataset
from .routes import webhooks, merchants, flags, dashboard, demo, copilot

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("sentinel")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed initial demo traffic if database is fresh
    merchants_list = db.list_merchants()
    if merchants_list:
        primary_merchant = merchants_list[0]
        existing_payments = db.list_payments(merchant_id=primary_merchant.id)
        if len(existing_payments) == 0:
            logger.info("Fresh database detected. Seeding baseline traffic & sample mule patterns...")
            try:
                await generate_dataset(merchant_id=primary_merchant.id, normal_count=45, mule_count=4)
                logger.info("Baseline seed complete.")
            except Exception as e:
                logger.error(f"Error during baseline seed: {e}")
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sentinel: An AI Merchant Mule-Pattern Early Warning Agent for Razorpay.",
    lifespan=lifespan
)

# Configure CORS for Next.js / Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(webhooks.router)
app.include_router(merchants.router)
app.include_router(flags.router)
app.include_router(dashboard.router)
app.include_router(demo.router)
app.include_router(copilot.router)

from fastapi import APIRouter
from .models import CustomSimulationInjectRequest
from .routes.demo import inject_custom_simulation

sim_router = APIRouter(prefix="/api/simulation", tags=["Simulation"])
sim_router.add_api_route("/inject-custom", inject_custom_simulation, methods=["POST"])
app.include_router(sim_router)

@app.get("/")
async def root():
    return {
        "system": "Sentinel AI Merchant Mule-Pattern Early Warning Agent",
        "status": "active",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health": "healthy"
    }
