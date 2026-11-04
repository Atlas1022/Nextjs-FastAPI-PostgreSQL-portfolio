
from datetime import datetime

from pydantic import BaseModel, ConfigDict


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
