import httpx
from ai_service import generate_ai_response
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Response

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from database import get_db, test_connection
from email_service import send_contact_email

from schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    SkillCreate,
    SkillUpdate,
    SkillResponse,
    ContactRequest,
)

from pydantic import BaseModel

from models import Project, AdminUser, Skill, SiteSetting

from auth import (
    verify_admin_password,
    get_current_admin,
    SESSION_SECRET_KEY,
    SESSION_COOKIE_NAME,
    SESSION_MAX_AGE,
)

from itsdangerous import URLSafeTimedSerializer


app = FastAPI(title="Portfolio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Session serializer
session_serializer = URLSafeTimedSerializer(
    SESSION_SECRET_KEY,
    salt="portfolio-admin-session"
)


# Login request schema
class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AIChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=2000
    )

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

# Admin-only endpoint: create a project
@app.post(
    "/api/admin/projects",
    response_model=ProjectResponse,
    status_code=201
)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    # Check whether the slug already exists
    existing_project = db.query(Project).filter(
        Project.slug == project_data.slug
    ).first()

    if existing_project:
        raise HTTPException(
            status_code=409,
            detail="A project with this slug already exists."
        )

    # Create a new project
    new_project = Project(
        **project_data.model_dump()
    )

    try:
        db.add(new_project)
        db.commit()
        db.refresh(new_project)

        return new_project

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to create project."
        )

# Admin-only endpoint: update a project
@app.put(
    "/api/admin/projects/{project_id}",
    response_model=ProjectResponse
)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    # Find the existing project
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found."
        )

    # Get only fields supplied in the request
    update_data = project_data.model_dump(
        exclude_unset=True
    )

    # Check whether the new slug belongs to another project
    new_slug = update_data.get("slug")

    if new_slug is not None:
        existing_project = db.query(Project).filter(
            Project.slug == new_slug,
            Project.id != project_id
        ).first()

        if existing_project:
            raise HTTPException(
                status_code=409,
                detail="A project with this slug already exists."
            )

    # Update project fields
    for field, value in update_data.items():
        setattr(project, field, value)

    try:
        db.commit()
        db.refresh(project)

        return project

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update project."
        )

# Admin-only endpoint: delete a project
@app.delete(
    "/api/admin/projects/{project_id}",
    status_code=200
)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    # Find the existing project
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found."
        )

    try:
        db.delete(project)
        db.commit()

        return {
            "message": "Project deleted successfully.",
            "project_id": project_id
        }

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete project."
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
        "admin_id": admin.id,
        "session_version": admin.session_version
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

@app.get("/api/admin/me")
def get_admin_profile(
    admin: AdminUser = Depends(get_current_admin)
):
    return {
        "id": admin.id,
        "username": admin.username,
        "is_active": admin.is_active
    }

@app.post("/api/admin/logout")
def admin_logout(response: Response):
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=False,
        samesite="lax"
    )

    return {
        "message": "Administrator logout successful."
    }

# Public endpoint: retrieve contact email
@app.get("/api/contact/email")
def get_contact_email(db: Session = Depends(get_db)):
    setting = db.query(SiteSetting).filter(
        SiteSetting.key == "contact_email"
    ).first()

    if setting is None:
        raise HTTPException(
            status_code=404,
            detail="Contact email is not configured."
        )

    return {"email": setting.value}

# ==========================================
# Skills API
# ==========================================

# Public endpoint: retrieve all skills
@app.get(
    "/api/skills",
    response_model=list[SkillResponse]
)
def get_skills(db: Session = Depends(get_db)):
    skills = (
        db.query(Skill)
        .order_by(Skill.category.asc(), Skill.name.asc())
        .all()
    )

    return skills


# Admin-only endpoint: create a skill
@app.post(
    "/api/admin/skills",
    response_model=SkillResponse,
    status_code=201
)
def create_skill(
    skill_data: SkillCreate,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    # Check whether the skill already exists
    existing_skill = db.query(Skill).filter(
        Skill.name.ilike(skill_data.name)
    ).first()

    if existing_skill:
        raise HTTPException(
            status_code=409,
            detail="This skill already exists."
        )

    new_skill = Skill(
        **skill_data.model_dump()
    )

    try:
        db.add(new_skill)
        db.commit()
        db.refresh(new_skill)

        return new_skill

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to create skill."
        )


# Admin-only endpoint: update a skill
@app.put(
    "/api/admin/skills/{skill_id}",
    response_model=SkillResponse
)
def update_skill(
    skill_id: int,
    skill_data: SkillUpdate,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    skill = db.query(Skill).filter(
        Skill.id == skill_id
    ).first()

    if skill is None:
        raise HTTPException(
            status_code=404,
            detail="Skill not found."
        )

    update_data = skill_data.model_dump(
        exclude_unset=True
    )

    new_name = update_data.get("name")

    if new_name is not None:
        existing_skill = db.query(Skill).filter(
            Skill.name.ilike(new_name),
            Skill.id != skill_id
        ).first()

        if existing_skill:
            raise HTTPException(
                status_code=409,
                detail="This skill already exists."
            )

    for field, value in update_data.items():
        setattr(skill, field, value)

    try:
        db.commit()
        db.refresh(skill)

        return skill

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update skill."
        )


# Admin-only endpoint: delete a skill
@app.delete(
    "/api/admin/skills/{skill_id}",
    status_code=200
)
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    skill = db.query(Skill).filter(
        Skill.id == skill_id
    ).first()

    if skill is None:
        raise HTTPException(
            status_code=404,
            detail="Skill not found."
        )

    try:
        db.delete(skill)
        db.commit()

        return {
            "message": "Skill deleted successfully.",
            "skill_id": skill_id
        }

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to delete skill."
        )

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


# ==========================================
# Contact API
# ==========================================

# Public endpoint: submit a contact form message
@app.post("/api/contact", status_code=200)
def submit_contact_message(
    contact_data: ContactRequest,
    db: Session = Depends(get_db),
):
    # Retrieve the recipient email from Neon PostgreSQL
    setting = db.query(SiteSetting).filter(
        SiteSetting.key == "contact_email"
    ).first()

    if setting is None:
        raise HTTPException(
            status_code=503,
            detail="Contact email is not configured.",
        )

    try:
        # Send the contact message through Resend
        send_contact_email(
            name=contact_data.name.strip(),
            email=contact_data.email.strip(),
            subject=contact_data.subject.strip(),
            message=contact_data.message.strip(),
            recipient=setting.value,
        )

        return {
            "message": "Your message has been sent successfully."
        }

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Unable to send your message. Please try again later.",
        )


# ==========================================
# AI Chat API
# ==========================================


@app.post("/api/ai/chat")
async def ai_chat(
    request: AIChatRequest,
    db: Session = Depends(get_db),
):
    try:
        # Retrieve public portfolio projects
        projects = (
            db.query(Project)
            .order_by(
                Project.is_featured.desc(),
                Project.created_at.desc(),
            )
            .all()
        )

        # Retrieve public portfolio skills
        skills = (
            db.query(Skill)
            .order_by(
                Skill.category.asc(),
                Skill.name.asc(),
            )
            .all()
        )

        # Prepare safe portfolio data for the AI
        portfolio_context = {
            "projects": [
                {
                    "title": project.title,
                    "description": project.description,
                    "tech_stack": project.tech_stack,
                    "project_url": project.project_url,
                    "is_featured": project.is_featured,
                }
                for project in projects
            ],
            "skills": [
                {
                    "name": skill.name,
                    "category": skill.category,
                    "proficiency": skill.proficiency,
                }
                for skill in skills
            ],
        }

        answer = await generate_ai_response(
            request.message.strip(),
            portfolio_context,
        )

        return {"answer": answer}

    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail="AI service is not configured.",
        )

    except httpx.HTTPError:
        raise HTTPException(
            status_code=502,
            detail="Unable to communicate with the AI service.",
        )

    except (KeyError, IndexError, TypeError):
        raise HTTPException(
            status_code=502,
            detail="Invalid response from the AI service.",
        )

    try:
        answer = await generate_ai_response(
            request.message.strip()
        )

        return {
            "answer": answer
        }

    except RuntimeError:
        raise HTTPException(
            status_code=503,
            detail="AI service is not configured."
        )

    except httpx.HTTPError:
        raise HTTPException(
            status_code=502,
            detail="Unable to communicate with the AI service."
        )

    except (KeyError, IndexError, TypeError):
        raise HTTPException(
            status_code=502,
            detail="Invalid response from the AI service."
        )