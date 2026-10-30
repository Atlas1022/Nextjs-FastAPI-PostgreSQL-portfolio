from fastapi import FastAPI, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from database import test_connection

app = FastAPI(title="Portfolio API")


@app.get("/")
def home():
    return {"message": "Portfolio API is running!"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/health/db")
def database_health_check():
    try:
        result = test_connection()

        return {
            "status": "connected",
            "database": "Neon PostgreSQL",
            "test_query_result": result
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed."
        )
