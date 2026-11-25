
"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { apiFetch } from "@/lib/api";

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
};

type ContactEmailResponse = {
  email: string;
};

type FormStatus = {
  type: "success" | "error";
  message: string;
};

const initialFormData: ContactFormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

export default function ContactForm() {
  const [contactEmail, setContactEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(true);
  const [formData, setFormData] =
    useState<ContactFormData>(initialFormData);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<FormStatus | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadContactEmail() {
      try {
        const data = (await apiFetch(
          "/api/contact/email"
        )) as ContactEmailResponse;

        if (isMounted) {
          setContactEmail(data.email);
        }
      } catch (error) {
        console.error("Contact email loading error:", error);
      } finally {
        if (isMounted) {
          setEmailLoading(false);
        }
      }
    }

    loadContactEmail();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsSending(true);

    try {
      await apiFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          website: formData.website.trim(), // Include the honeypot field in the request
        }),
      });

      setStatus({
        type: "success",
        message:
          "Your message has been sent successfully. I'll get back to you soon.",
      });

      setFormData(initialFormData);
    } catch (error) {
      console.error("Contact form submission error:", error);

      setStatus({
        type: "error",
        message:
          "Unable to send your message right now. Please try again later.",
      });
    } finally {
      setIsSending(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-700 bg-[#0b1120] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";

  return (
    <section
      id="contact"
      className="border-y border-slate-800 bg-[#0b1120] text-white"
    >
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-semibold tracking-[0.2em] text-sky-400">
            GET IN TOUCH
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Let's Work Together
          </h2>

          <p className="mt-4 leading-7 text-slate-400">
            Have a project in mind or want to discuss an opportunity?
            Send me a message and I'll get back to you.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <p className="text-sm font-semibold text-slate-400">
                EMAIL
              </p>

              {emailLoading ? (
                <p className="mt-3 text-slate-400">
                  Loading contact email...
                </p>
              ) : contactEmail ? (
                <a
                  href={`mailto:${contactEmail}`}
                  className="mt-3 inline-block break-all text-sky-400 transition hover:text-sky-300"
                >
                  {contactEmail}
                </a>
              ) : (
                <p className="mt-3 text-slate-400">
                  Contact email is currently unavailable.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <p className="text-sm font-semibold text-slate-400">
                LET'S CONNECT
              </p>

              <p className="mt-3 leading-7 text-slate-300">
                Use the contact form to tell me about your project,
                an opportunity, or anything you'd like to discuss.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl sm:p-8"
          >
            {/* Honeypot field for spam protection */}
            <div
              aria-hidden="true"
              className="absolute -left-[9999px] h-px w-px overflow-hidden"
            >
              <input
                id="contact-extra-field"
                name="extra_field"
                type="text"
                tabIndex={-1}
                autoComplete="new-password"
                autoCapitalize="off"
                spellCheck={false}
                value={formData.website}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    website: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="contact-name"
                  className="text-sm font-medium text-slate-300"
                >
                  Your Name
                </label>

                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="text-sm font-medium text-slate-300"
                >
                  Email Address
                </label>

                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="contact-subject"
                className="text-sm font-medium text-slate-300"
              >
                Subject
              </label>

              <input
                id="contact-subject"
                name="subject"
                type="text"
                required
                minLength={3}
                maxLength={150}
                value={formData.subject}
                onChange={handleChange}
                placeholder="What would you like to discuss?"
                className={inputClass}
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="contact-message"
                className="text-sm font-medium text-slate-300"
              >
                Message
              </label>

              <textarea
                id="contact-message"
                name="message"
                required
                minLength={10}
                maxLength={5000}
                rows={6}
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell me a little about your project or inquiry..."
                className={`${inputClass} resize-y`}
              />
            </div>

            {status && (
              <p
                role="status"
                aria-live="polite"
                className={`mt-5 rounded-lg border p-3 text-sm ${status.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
                  }`}
              >
                {status.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSending ? "Sending..." : "Send Message"}
              {!isSending && <span aria-hidden="true">→</span>}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
