
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


# Request schema: create a project
class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    slug: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=1)

    tech_stack: str | None = Field(default=None, max_length=500)
    project_url: str | None = Field(default=None, max_length=500)
    image_url: str | None = Field(default=None, max_length=500)

    is_featured: bool = False


# Request schema: update a project
class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=150)
    slug: str | None = Field(default=None, max_length=180)
    description: str | None = None

    tech_stack: str | None = Field(default=None, max_length=500)
    project_url: str | None = Field(default=None, max_length=500)
    image_url: str | None = Field(default=None, max_length=500)

    is_featured: bool | None = None

    @model_validator(mode="after")
    def validate_required_fields(self):
        required_fields = (
            "title",
            "slug",
            "description",
            "is_featured",
        )

        for field in required_fields:
            if field in self.model_fields_set:
                if getattr(self, field) is None:
                    raise ValueError(f"{field} cannot be null.")

        return self


# Response schema: return project information
class ProjectResponse(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    tech_stack: str | None
    project_url: str | None
    image_url: str | None
    is_featured: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Allowed skill proficiency levels
SKILL_PROFICIENCY_LEVELS = (
    "Beginner",
    "Intermediate",
    "Advanced",
    "Expert",
)


# Request schema: create a skill
class SkillCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=100)
    proficiency: str = Field(min_length=1, max_length=50)

    @model_validator(mode="after")
    def validate_proficiency(self):
        if self.proficiency not in SKILL_PROFICIENCY_LEVELS:
            raise ValueError(
                "Proficiency must be Beginner, Intermediate, Advanced, or Expert."
            )
        return self


# Request schema: update a skill
class SkillUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    proficiency: str | None = Field(default=None, max_length=50)

    @model_validator(mode="after")
    def validate_skill_fields(self):
        for field in ("name", "category", "proficiency"):
            if field in self.model_fields_set:
                value = getattr(self, field)

                if value is None or not value.strip():
                    raise ValueError(f"{field} cannot be empty.")

        if (
            self.proficiency is not None
            and self.proficiency not in SKILL_PROFICIENCY_LEVELS
        ):
            raise ValueError(
                "Proficiency must be Beginner, Intermediate, Advanced, or Expert."
            )

        return self


# Response schema: return skill information
class SkillResponse(BaseModel):
    id: int
    name: str
    category: str
    proficiency: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)