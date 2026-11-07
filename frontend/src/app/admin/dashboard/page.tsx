
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

const initialForm: ProjectForm = {
  title: "",
  slug: "",
  description: "",
  tech_stack: "",
  project_url: "",
  image_url: "",
  is_featured: false,
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState<ProjectForm>(initialForm);
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
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/admin/login");
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  function handleInputChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
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

  async function handleCreateProject(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      const newProject = await apiFetch("/api/admin/projects", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
          tech_stack: form.tech_stack.trim() || null,
          project_url: form.project_url.trim() || null,
          image_url: form.image_url.trim() || null,
          is_featured: form.is_featured,
        }),
      });

      setProjects((previous) => [...previous, newProject]);
      setForm(initialForm);
      setSuccessMessage("Project created successfully!");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/admin/login");
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create project."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await apiFetch("/api/admin/logout", {
        method: "POST",
      });

      router.replace("/admin/login");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to log out."
      );
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Portfolio management
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-600 sm:inline">
              {admin?.username}
            </span>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Welcome, {admin?.username}!
          </h2>
          <p className="mt-2 text-slate-600">
            Manage your portfolio projects from here.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {/* Project overview */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Project Overview
          </h3>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {projects.length}
          </p>

          <p className="text-sm text-slate-500">
            Total projects
          </p>
        </div>

        {/* Create project form */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-slate-900">
            Add New Project
          </h3>

          <form
            onSubmit={handleCreateProject}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Project Title *
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleInputChange}
                maxLength={150}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="My Portfolio Website"
              />
            </div>

            <div>
              <label
                htmlFor="slug"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Project Slug *
              </label>

              <input
                id="slug"
                name="slug"
                type="text"
                value={form.slug}
                onChange={handleInputChange}
                maxLength={180}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="my-portfolio-website"
              />

              <p className="mt-1 text-xs text-slate-500">
                Used in the project URL. Use lowercase letters,
                numbers, and hyphens.
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Description *
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleInputChange}
                required
                rows={5}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Describe your project..."
              />
            </div>

            <div>
              <label
                htmlFor="tech_stack"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Technology Stack
              </label>

              <input
                id="tech_stack"
                name="tech_stack"
                type="text"
                value={form.tech_stack}
                onChange={handleInputChange}
                maxLength={500}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Next.js, FastAPI, PostgreSQL, Tailwind CSS"
              />
            </div>

            <div>
              <label
                htmlFor="project_url"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Project URL
              </label>

              <input
                id="project_url"
                name="project_url"
                type="url"
                value={form.project_url}
                onChange={handleInputChange}
                maxLength={500}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="https://github.com/username/project"
              />
            </div>

            <div>
              <label
                htmlFor="image_url"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Project Image URL
              </label>

              <input
                id="image_url"
                name="image_url"
                type="url"
                value={form.image_url}
                onChange={handleInputChange}
                maxLength={500}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="https://example.com/project-image.jpg"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="is_featured"
                type="checkbox"
                checked={form.is_featured}
                onChange={handleFeaturedChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />

              <label
                htmlFor="is_featured"
                className="text-sm font-medium text-slate-700"
              >
                Mark this project as featured
              </label>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Creating Project..." : "Create Project"}
            </button>
          </form>
        </div>

        {/* Project list */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-slate-900">
            Your Projects
          </h3>

          {projects.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No projects found. Add your first project above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Featured</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b border-slate-100"
                    >
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {project.title}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {project.slug}
                      </td>

                      <td className="px-4 py-4">
                        {project.is_featured ? "Yes" : "No"}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {new Date(
                          project.created_at
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
