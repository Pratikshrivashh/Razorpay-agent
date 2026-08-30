import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from root .env
root_dir = Path(__file__).resolve().parent.parent.parent
env_path = root_dir / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "Sentinel: AI Merchant Mule-Pattern Early Warning Agent"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # API Keys & Secrets
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "my_test_webhook_secret_123")
    
    # Persistence
    DATABASE_TYPE: str = os.getenv("DATABASE_TYPE", "json")
    DB_PATH: Path = root_dir / "backend" / "data" / "db.json"
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Scoring Thresholds
    SCORE_LOW_THRESHOLD: int = 30
    SCORE_MED_THRESHOLD: int = 60
    SCORE_HIGH_THRESHOLD: int = 80

settings = Settings()
