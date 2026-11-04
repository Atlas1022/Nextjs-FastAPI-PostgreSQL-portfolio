
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker, Session


# Project root directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Load environment variables
ENV_FILE = PROJECT_ROOT / ".env.local"
load_dotenv(ENV_FILE)


# Get database URL
database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise RuntimeError(
        "DATABASE_URL was not found in the root .env.local file."
    )


# Configure Psycopg 3
database_url = make_url(database_url).set(
    drivername="postgresql+psycopg"
)


# Create SQLAlchemy engine
engine = create_engine(
    database_url,
    pool_pre_ping=True,
)


# Create a database session factory
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


# Database session dependency for FastAPI
def get_db():
    db: Session = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# Test database connection
def test_connection():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return result.scalar()
