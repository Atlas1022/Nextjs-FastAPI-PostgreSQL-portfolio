export const instant = false;

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

type Skill = {
  id: number;
  name: string;
  category: string;
  proficiency: string;
  created_at: string;
};

async function getProjects(): Promise<Project[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API URL is not configured.");
  }

  const response = await fetch(`${apiUrl}/api/projects`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to retrieve projects from the API.");
  }

  return response.json();
}

async function getSkills(): Promise<Skill[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API URL is not configured.");
  }

  const response = await fetch(`${apiUrl}/api/skills`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to retrieve skills from the API.");
  }

  return response.json();
}

export default async function Home() {
  let projects: Project[] = [];
  let skills: Skill[] = [];

  let errorMessage = "";
  let skillErrorMessage = "";

  try {
    projects = await getProjects();
    projects.sort((a, b) => {
      return Number(b.is_featured) - Number(a.is_featured);
    });
  } catch (error) {
    console.error("Project loading error:", error);
    errorMessage = "Unable to load projects. Please try again later.";
  }

  try {
    skills = await getSkills();
  } catch (error) {
    console.error("Skill loading error:", error);
    skillErrorMessage = "Unable to load skills. Please try again later.";
  }

  return (
    <main className="min-h-screen">
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0b1120]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="/" className="text-xl font-bold tracking-tight text-white">
            My Portfolio<span className="text-sky-400">.</span>
          </a>

          <div className="flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#about" className="transition hover:text-sky-400">
              About
            </a>

            <a href="#skills" className="transition hover:text-sky-400">
              Skills
            </a>

            <a href="#projects" className="transition hover:text-sky-400">
              Projects
            </a>

            <a href="#contact" className="transition hover:text-sky-400">
              Contact
            </a>
          </div>
        </nav>
      </header>


            
      {/* Hero section */}
      <section className="relative mx-auto max-w-6xl px-6 py-28 sm:py-36">
        <div className="max-w-3xl">
          <p className="mb-5 font-semibold tracking-widest text-sky-400">
            FULL-STACK WEB DEVELOPER
          </p>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Building modern web applications and digital experiences.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
            I develop responsive, scalable, and user-friendly web
            applications using modern frontend and backend technologies.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#projects"
              className="rounded-lg bg-sky-500 px-7 py-3.5 font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Explore My Projects →
            </a>

            <a
              href="#contact"
              className="rounded-lg border border-slate-700 px-7 py-3.5 font-semibold text-white transition hover:border-sky-400 hover:text-sky-400"
            >
              Contact Me
            </a>
          </div>
        </div>
      </section>


      {/* About section */}
      <section id="about" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold">About Me</h2>

          <p className="mt-5 max-w-3xl leading-8 text-slate-600">
            I am a full-stack web developer interested in building
            reliable web applications, designing clean user interfaces,
            and developing efficient backend systems.
          </p>
        </div>
      </section>

      {/* Skills section */}
      <section
        id="skills"
        className="border-y border-slate-800 bg-[#0b1120] text-white"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10">
            <p className="font-semibold tracking-widest text-sky-400">
              MY EXPERTISE
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Technical Skills
            </h2>

            <p className="mt-3 text-slate-400">
              Technologies and tools I use to build modern web applications.
            </p>
          </div>

          {skillErrorMessage ? (
            <p className="rounded-lg bg-red-950 p-5 text-red-300">
              {skillErrorMessage}
            </p>
          ) : skills.length === 0 ? (
            <p className="rounded-lg border border-slate-700 p-8 text-center text-slate-400">
              No skills are available yet.
            </p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {Object.entries(
                skills.reduce<Record<string, Skill[]>>((groups, skill) => {
                  if (!groups[skill.category]) {
                    groups[skill.category] = [];
                  }

                  groups[skill.category].push(skill);

                  return groups;
                }, {})
              ).map(([category, categorySkills]) => (
                <div
                  key={category}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-6"
                >
                  <h3 className="mb-5 text-xl font-semibold text-sky-400">
                    {category}
                  </h3>

                  <div className="space-y-4">
                    {categorySkills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 last:border-0 last:pb-0"
                      >
                        <span className="font-medium text-slate-200">
                          {skill.name}
                        </span>

                        <span className="rounded-full bg-sky-950 px-3 py-1 text-xs font-semibold text-sky-300">
                          {skill.proficiency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Projects section */}
      <section id="projects" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10">
          <p className="font-semibold text-blue-600">MY WORK</p>
          <h2 className="mt-2 text-3xl font-bold">
            Featured Projects
          </h2>
          <p className="mt-3 text-slate-600">
            A selection of applications and projects I have developed.
          </p>
        </div>

        {errorMessage ? (
          <p className="rounded-lg bg-red-50 p-5 text-red-700">
            {errorMessage}
          </p>
        ) : projects.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
            No projects are available yet. Please check back later.
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Contact section */}
      <section id="contact" className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold">Let's Work Together</h2>

          <p className="mt-4 text-slate-300">
            Interested in working together? Feel free to get in touch.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 px-6 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} My Portfolio. All rights reserved.
      </footer>
    </main>
  );
}
