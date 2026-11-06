
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

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

export default function AdminDashboardPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const adminData = await apiFetch("/api/admin/me");
        setAdmin(adminData);

        const projectData = await apiFetch("/api/projects");
        setProjects(projectData);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("401")
        ) {
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

        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
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

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Your Projects
            </h3>
          </div>

          {projects.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No projects found. You can add your first project later.
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
