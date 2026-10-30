import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env.local"
load_dotenv(ENV_FILE)
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL was not found in the root .env.local file.")
database_url = make_url(database_url).set(
    drivername="postgresql+psycopg"
)
engine = create_engine(
    database_url,
    pool_pre_ping=True,
)

def test_connection():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return result.scalar()
