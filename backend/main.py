
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database import get_db, test_connection
from models import Project
from schemas import ProjectResponse

from fastapi import Response
from pydantic import BaseModel

from auth import (
    verify_admin_password,
    SESSION_SECRET_KEY,
    SESSION_COOKIE_NAME,
    SESSION_MAX_AGE,
)

from itsdangerous import URLSafeTimedSerializer


app = FastAPI(title="Portfolio API")

# Session serializer
session_serializer = URLSafeTimedSerializer(
    SESSION_SECRET_KEY,
    salt="portfolio-admin-session"
)


# Login request schema
class AdminLoginRequest(BaseModel):
    username: str
    password: str

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

@app.post("/api/admin/login")
def admin_login(
    login_data: AdminLoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    admin = verify_admin_password(
        login_data.username,
        login_data.password,
        db
    )

    if admin is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password."
        )

    # Create signed session data
    session_token = session_serializer.dumps({
        "admin_id": admin.id
    })

    # Set HTTP-only session cookie
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_token,
        max_age=SESSION_MAX_AGE,
        httponly=True,
        secure=False,  # Change to True in production (HTTPS)
        samesite="lax",
        path="/"
    )

    return {
        "message": "Administrator login successful.",
        "username": admin.username
    }

# Public endpoint: retrieve all projects
@app.get(
    "/api/projects",
    response_model=list[ProjectResponse]
)
def get_projects(db: Session = Depends(get_db)):
    projects = (
        db.query(Project)
        .order_by(Project.created_at.desc())
        .all()
    )

    return projects


# Public endpoint: retrieve one project by ID
@app.get(
    "/api/projects/{project_id}",
    response_model=ProjectResponse
)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found."
        )

    return project
