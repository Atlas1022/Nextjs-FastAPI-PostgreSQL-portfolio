
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
