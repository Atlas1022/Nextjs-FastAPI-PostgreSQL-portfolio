"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

type Admin = {
  id: number;
  username: string;
  is_active: boolean;
};

type Project = {
  id: number;
  title: string;
  slug: string;
  description: string;
  tech_stack: string | null;
  project_url: string | null;
  image_url: string | null;
  is_featured: boolean;
  created_at: string;
};

type ProjectForm = {
  title: string;
  slug: string;
  description: string;
  tech_stack: string;
  project_url: string;
  image_url: string;
  is_featured: boolean;
};

type Skill = {
  id: number;
  name: string;
  category: string;
  proficiency: string;
  created_at: string;
};

type SkillForm = {
  name: string;
  category: string;
  proficiency: string;
};

const initialSkillForm: SkillForm = {
  name: "",
  category: "",
  proficiency: "Intermediate",
};

const initialForm: ProjectForm = {
  title: "",
  slug: "",
  description: "",
  tech_stack: "",
  project_url: "",
  image_url: "",
  is_featured: false,
};

export default function AdminDashboard() {
  const router = useRouter();

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [skills, setSkills] = useState<Skill[]>([]);

  const [skillForm, setSkillForm] =
    useState<SkillForm>(initialSkillForm);

  const [editingSkillId, setEditingSkillId] =
    useState<number | null>(null);

  const [isSavingSkill, setIsSavingSkill] = useState(false);

  const [isDeletingSkillId, setIsDeletingSkillId] =
    useState<number | null>(null);

  const [form, setForm] = useState<ProjectForm>(initialForm);

  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);

  // Control Project form visibility
  const [showProjectForm, setShowProjectForm] = useState(false);

  // Control Skill form visibility
  const [showSkillForm, setShowSkillForm] = useState(false);

  const [isDeletingProjectId, setIsDeletingProjectId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const adminData = await apiFetch("/api/admin/me");
        setAdmin(adminData);

        const projectData = await apiFetch("/api/projects");
        setProjects(projectData);
        const skillData = await apiFetch("/api/skills");
        setSkills(skillData);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/admin/login");
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load dashboard."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleFeaturedChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm((previous) => ({
      ...previous,
      is_featured: event.target.checked,
    }));
  }

  function handleCreateProject() {
    setEditingProjectId(null);
    setForm(initialForm);
    setErrorMessage("");
    setSuccessMessage("");
    setShowProjectForm(true);
    setShowSkillForm(false);
  }

  function handleEditProject(project: Project) {
    setShowProjectForm(true);
    setShowSkillForm(false);
    setEditingProjectId(project.id);

    setForm({
      title: project.title,
      slug: project.slug,
      description: project.description,
      tech_stack: project.tech_stack ?? "",
      project_url: project.project_url ?? "",
      image_url: project.image_url ?? "",
      is_featured: project.is_featured,
    });

    setErrorMessage("");
    setSuccessMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function handleDeleteProject(project: Project) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.title}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingProjectId(project.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await apiFetch(`/api/admin/projects/${project.id}`, {
        method: "DELETE",
      });

      setProjects((previous) =>
        previous.filter((item) => item.id !== project.id)
      );

      if (editingProjectId === project.id) {
        setEditingProjectId(null);
        setForm(initialForm);
      }

      setSuccessMessage("Project deleted successfully!");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/admin/login");
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete project."
      );
    } finally {
      setIsDeletingProjectId(null);
    }
  }
  function handleCancelEdit() {
    setShowProjectForm(false);
    setEditingProjectId(null);
    setForm(initialForm);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const projectData = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      tech_stack: form.tech_stack.trim() || null,
      project_url: form.project_url.trim() || null,
      image_url: form.image_url.trim() || null,
      is_featured: form.is_featured,
    };

    try {
      if (editingProjectId !== null) {
        const updatedProject = await apiFetch(
          `/api/admin/projects/${editingProjectId}`,
          {
            method: "PUT",
            body: JSON.stringify(projectData),
          }
        );

        setProjects((previous) =>
          previous.map((project) =>
            project.id === updatedProject.id ? updatedProject : project
          )
        );

        setEditingProjectId(null);
        setForm(initialForm);
        setSuccessMessage("Project updated successfully!");
      } else {
        const newProject = await apiFetch("/api/admin/projects", {
          method: "POST",
          body: JSON.stringify(projectData),
        });

        setProjects((previous) => [...previous, newProject]);
        setForm(initialForm);
        setSuccessMessage("Project created successfully!");
      }
      setShowProjectForm(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/admin/login");
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save project."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleSkillInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setSkillForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleCreateSkill() {
    setEditingSkillId(null);
    setSkillForm(initialSkillForm);
    setErrorMessage("");
    setSuccessMessage("");
    setShowSkillForm(true);
    setShowProjectForm(false);
  }

  function handleEditSkill(skill: Skill) {
    setShowSkillForm(true);
    setShowProjectForm(false);
    setEditingSkillId(skill.id);

    setSkillForm({
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
    });

    setErrorMessage("");
    setSuccessMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelSkillEdit() {
    setShowSkillForm(false);
    setEditingSkillId(null);
    setSkillForm(initialSkillForm);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleDeleteSkill(skill: Skill) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${skill.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeletingSkillId(skill.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await apiFetch(`/api/admin/skills/${skill.id}`, {
        method: "DELETE",
      });

      setSkills((previous) =>
        previous.filter((item) => item.id !== skill.id)
      );

      if (editingSkillId === skill.id) {
        setEditingSkillId(null);
        setSkillForm(initialSkillForm);
      }

      setSuccessMessage("Skill deleted successfully!");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/admin/login");
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete skill."
      );
    } finally {
      setIsDeletingSkillId(null);
    }
  }

  async function handleSubmitSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSavingSkill(true);
    setErrorMessage("");
    setSuccessMessage("");

    const skillData = {
      name: skillForm.name.trim(),
      category: skillForm.category.trim(),
      proficiency: skillForm.proficiency,
    };

    try {
      if (editingSkillId !== null) {
        const updatedSkill = await apiFetch(
          `/api/admin/skills/${editingSkillId}`,
          {
            method: "PUT",
            body: JSON.stringify(skillData),
          }
        );

        setSkills((previous) =>
          previous.map((skill) =>
            skill.id === updatedSkill.id ? updatedSkill : skill
          )
        );

        setEditingSkillId(null);
        setSkillForm(initialSkillForm);
        setSuccessMessage("Skill updated successfully!");
      } else {
        const newSkill = await apiFetch("/api/admin/skills", {
          method: "POST",
          body: JSON.stringify(skillData),
        });

        setSkills((previous) => [...previous, newSkill]);
        setSkillForm(initialSkillForm);
        setSuccessMessage("Skill created successfully!");
      }
      setShowSkillForm(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/admin/login");
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save skill."
      );
    } finally {
      setIsSavingSkill(false);
    }
  }

  async function handleLogout() {
    try {
      await apiFetch("/api/admin/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  if (isLoading) {
    return <main className="p-8">Loading dashboard...</main>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 md:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome, {admin?.username}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </header>

        {errorMessage && (
          <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="mb-4 rounded-lg bg-green-100 p-3 text-green-700">
            {successMessage}
          </p>
        )}
        {/* Project Management Section */}
        <section className="mb-12 rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Projects ({projects.length})</h2>

            <button
              type="button"
              onClick={handleCreateProject}
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              + Create Project
            </button>
          </div>

          {showProjectForm && (
            <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold">
                {editingProjectId !== null ? "Edit Project" : "Create Project"}
              </h2>

              <form onSubmit={handleSubmitProject} className="space-y-4">
                <div>
                  <label htmlFor="title" className="mb-1 block font-medium">
                    Project Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    required
                    maxLength={150}
                    className="w-full rounded-lg border p-3"
                  />
                </div>

                <div>
                  <label htmlFor="slug" className="mb-1 block font-medium">
                    Slug
                  </label>
                  <input
                    id="slug"
                    name="slug"
                    value={form.slug}
                    onChange={handleInputChange}
                    required
                    maxLength={180}
                    className="w-full rounded-lg border p-3"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Example: my-portfolio-project
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="mb-1 block font-medium">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full rounded-lg border p-3"
                  />
                </div>

                <div>
                  <label htmlFor="tech_stack" className="mb-1 block font-medium">
                    Technology Stack
                  </label>
                  <input
                    id="tech_stack"
                    name="tech_stack"
                    value={form.tech_stack}
                    onChange={handleInputChange}
                    maxLength={500}
                    placeholder="Next.js, FastAPI, PostgreSQL"
                    className="w-full rounded-lg border p-3"
                  />
                </div>

                <div>
                  <label htmlFor="project_url" className="mb-1 block font-medium">
                    Project URL
                  </label>
                  <input
                    id="project_url"
                    name="project_url"
                    type="url"
                    value={form.project_url}
                    onChange={handleInputChange}
                    maxLength={500}
                    placeholder="https://example.com"
                    className="w-full rounded-lg border p-3"
                  />
                </div>

                <div>
                  <label htmlFor="image_url" className="mb-1 block font-medium">
                    Image URL
                  </label>
                  <input
                    id="image_url"
                    name="image_url"
                    type="url"
                    value={form.image_url}
                    onChange={handleInputChange}
                    maxLength={500}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-lg border p-3"
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={handleFeaturedChange}
                    className="h-4 w-4"
                  />
                  Featured Project
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving
                      ? "Saving..."
                      : editingProjectId !== null
                        ? "Update Project"
                        : "Create Project"}
                  </button>

                  {editingProjectId !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="rounded-lg border px-6 py-3 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

          )}
          
          <section className="rounded-xl bg-white p-6 shadow-sm">
            
            {projects.length === 0 ? (
              <p className="text-gray-500">No projects found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {projects.map((project) => (
                  <article
                    key={project.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Project image */}
                    {project.image_url ? (
                      <img
                        src={project.image_url}
                        alt={project.title}
                        className="h-52 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center bg-slate-100 text-slate-400">
                        No project image
                      </div>
                    )}

                    <div className="p-6">
                      {project.is_featured && (
                        <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          Featured Project
                        </span>
                      )}

                      <h3 className="text-xl font-bold">
                        {project.title}
                      </h3>

                      <p className="mt-3 line-clamp-3 leading-7 text-slate-600">
                        {project.description}
                      </p>

                      {project.tech_stack && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {project.tech_stack
                            .split(",")
                            .map((technology) => technology.trim())
                            .filter(Boolean)
                            .map((technology) => (
                              <span
                                key={technology}
                                className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                              >
                                {technology}
                              </span>
                            ))}
                        </div>
                      )}

                      {project.project_url && (
                        <a
                          href={project.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-6 inline-block font-semibold text-blue-600 hover:text-blue-800"
                        >
                          View Project →
                        </a>
                      )}

                      <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                        <button
                          type="button"
                          onClick={() => handleEditProject(project)}
                          className="rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProject(project)}
                          disabled={isDeletingProjectId === project.id}
                          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {isDeletingProjectId === project.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>

                      <p className="mt-3 text-xs text-gray-500">
                        Created: {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>

        

                {/* Skill Management Section */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              Skills ({skills.length})
            </h2>

            <button
              type="button"
              onClick={handleCreateSkill}
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              + Create Skill
            </button>
          </div>

          {/* Skill Form */}
          {showSkillForm && (
            <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold">
                {editingSkillId !== null ? "Edit Skill" : "Create Skill"}
              </h2>

              <form onSubmit={handleSubmitSkill} className="space-y-4">
                <div>
                  <label htmlFor="skill-name" className="mb-1 block font-medium">
                    Skill Name
                  </label>
                  <input
                    id="skill-name"
                    name="name"
                    value={skillForm.name}
                    onChange={handleSkillInputChange}
                    required
                    maxLength={100}
                    placeholder="Python"
                    className="w-full rounded-lg border p-3"
                  />
                </div>

                <div>
                  <label htmlFor="skill-category" className="mb-1 block font-medium">
                    Category
                  </label>
                  <input
                    id="skill-category"
                    name="category"
                    value={skillForm.category}
                    onChange={handleSkillInputChange}
                    required
                    maxLength={100}
                    placeholder="Programming Languages"
                    className="w-full rounded-lg border p-3"
                  />
                </div>

                <div>
                  <label htmlFor="skill-proficiency" className="mb-1 block font-medium">
                    Proficiency
                  </label>
                  <select
                    id="skill-proficiency"
                    name="proficiency"
                    value={skillForm.proficiency}
                    onChange={handleSkillInputChange}
                    required
                    className="w-full rounded-lg border p-3"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isSavingSkill}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSavingSkill
                      ? "Saving..."
                      : editingSkillId !== null
                        ? "Update Skill"
                        : "Create Skill"}
                  </button>

                  {editingSkillId !== null && (
                    <button
                      type="button"
                      onClick={handleCancelSkillEdit}
                      disabled={isSavingSkill}
                      className="rounded-lg border px-6 py-3 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>
          )}

          {/* Skills List */}
          <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
            
            {skills.length === 0 ? (
              <p className="text-gray-500">No skills found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b text-sm text-gray-600">
                      <th className="p-3">Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Proficiency</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {skills.map((skill) => (
                      <tr key={skill.id} className="border-b">
                        <td className="p-3 font-medium">{skill.name}</td>
                        <td className="p-3">{skill.category}</td>
                        <td className="p-3">{skill.proficiency}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditSkill(skill)}
                              className="rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSkill(skill)}
                              disabled={isDeletingSkillId === skill.id}
                              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {isDeletingSkillId === skill.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}