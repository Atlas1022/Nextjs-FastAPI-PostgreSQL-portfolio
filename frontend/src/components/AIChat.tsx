
"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import ReactMarkdown from "react-markdown";

type Message = {
    role: "assistant" | "user";
    content: string;
};

type ChatResponse = {
    answer: string;
};

const WELCOME_MESSAGE: Message = {
    role: "assistant",
    content:
        "Hello! I'm your portfolio AI assistant. Ask me about projects, technical skills, or technologies.",
};

export default function AIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [messages, setMessages] = useState<Message[]>([
        WELCOME_MESSAGE,
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    function handleClearChat() {
        if (loading) return;

        setMessages([WELCOME_MESSAGE]);
        setInput("");
        setError("");
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, loading]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) return;

    setInput("");
    setError("");
    setLoading(true);

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: message,
      },
    ]);

    try {
      const data = (await apiFetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
      })) as ChatResponse;

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (err) {
      console.error("AI chat error:", err);
      setError(
        "Unable to get a response. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen && (
                <div className="mb-4 flex h-[500px] w-[calc(100vw-3rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#111c30] shadow-2xl">
                    {/* Chat header */}
                    <div className="flex items-center justify-between border-b border-slate-700 bg-[#17243a] p-4">
                        <div>
                            <h2 className="font-semibold text-white">
                                Portfolio AI Assistant
                            </h2>
                            <p className="mt-1 text-xs text-sky-400">
                                Ask me anything about this portfolio
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleClearChat}
                                disabled={loading}
                                className="rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Clear
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close chat"
                                className="rounded-lg px-3 py-1 text-xl text-slate-400 transition hover:bg-slate-700 hover:text-white"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                    {/* Messages */}
                    <div
                        className="flex-1 space-y-4 overflow-y-auto p-4"
                        aria-live="polite"
                    >
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                            >
                                <div
                                    className={`max-w-[85%] break-words rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user"
                                            ? "whitespace-pre-wrap bg-sky-500 text-slate-950"
                                            : "bg-slate-800 text-slate-200"
                                        }`}
                                >
                                    {message.role === "assistant" ? (
                                        <div className="space-y-2 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:mb-2 [&_strong]:font-bold [&_ul]:space-y-1 [&_a]:text-sky-400 [&_a]:underline">
                                            <ReactMarkdown>
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        message.content
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div
                                    className="flex items-center gap-2 rounded-2xl bg-slate-800 px-4 py-3"
                                    role="status"
                                    aria-label="AI assistant is thinking"
                                >
                                    <span className="text-xs text-slate-400">
                                        Thinking
                                    </span>

                                    <div className="flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.3s]" />
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.15s]" />
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-400" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Error message */}
                    {error && (
                        <p className="px-4 pb-2 text-sm text-red-400">
                            {error}
                        </p>
                    )}

                    {/* Message input */}
                    <form
                        onSubmit={handleSubmit}
                        className="flex gap-2 border-t border-slate-700 p-3"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder="Type your message..."
                            maxLength={2000}
                            disabled={loading}
                            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-[#0b1120] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400 disabled:opacity-50"
                        />

                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            aria-label="Send message"
                            className="rounded-lg bg-sky-500 px-4 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}

            {/* Floating chat button */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => setIsOpen((previous) => !previous)}
                    aria-label={
                        isOpen
                            ? "Close AI assistant"
                            : "Open AI assistant"
                    }
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-2xl text-slate-950 shadow-lg shadow-sky-500/20 transition hover:scale-105 hover:bg-sky-400"
                >
                    {isOpen ? "×" : "AI"}
                </button>
            </div>
        </div>
    );
}
