
"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import ReactMarkdown from "react-markdown";

type Message = {
    role: "assistant" | "user";
    content: string;
    timestamp: string;
};

type ChatResponse = {
    answer: string;
};

const WELCOME_MESSAGE: Message = {
    role: "assistant",
    content:
        "Hello! I'm your portfolio AI assistant. Ask me about projects, technical skills, or technologies.",
    timestamp: new Date().toISOString(),
};
const SUGGESTED_QUESTIONS = [
    "What projects has the developer built?",
    "What technologies does the developer use?",
    "What are the developer's technical skills?",
];
function getDateLabel(timestamp: string): string {
    const messageDate = new Date(timestamp);
    const today = new Date();

    const isToday =
        messageDate.toDateString() === today.toDateString();

    if (isToday) return "Today";

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const isYesterday =
        messageDate.toDateString() === yesterday.toDateString();

    if (isYesterday) return "Yesterday";

    return messageDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}
const CHAT_STORAGE_KEY = "portfolio-ai-chat-history";

export default function AIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [failedMessage, setFailedMessage] = useState("");
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        WELCOME_MESSAGE,
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // Restore conversation history from sessionStorage
    useEffect(() => {
        try {
            const savedMessages = sessionStorage.getItem(CHAT_STORAGE_KEY);

            if (savedMessages) {
                const parsedMessages: unknown = JSON.parse(savedMessages);

                if (
                    Array.isArray(parsedMessages) &&
                    parsedMessages.length > 0 &&
                    parsedMessages.every(
                        (message) =>
                            message &&
                            typeof message === "object" &&
                            ["assistant", "user"].includes(message.role) &&
                            typeof message.content === "string"
                    )
                ) {
                    const restoredMessages = parsedMessages as Message[];

                    setMessages(
                        restoredMessages.map((message) => ({
                            ...message,
                            timestamp:
                                typeof message.timestamp === "string"
                                    ? message.timestamp
                                    : new Date().toISOString(),
                        }))
                    );
                }
            }
        } catch (err) {
            console.error("Unable to restore chat history:", err);
            sessionStorage.removeItem(CHAT_STORAGE_KEY);
        }
        setHistoryLoaded(true);
    }, []);
    useEffect(() => {
        if (!historyLoaded) return;

        if (messages.length > 1) {
            sessionStorage.setItem(
                CHAT_STORAGE_KEY,
                JSON.stringify(messages)
            );
        } else {
            sessionStorage.removeItem(CHAT_STORAGE_KEY);
        }
    }, [messages, historyLoaded]);
    function handleClearChat() {
        if (loading) return;

        setMessages([WELCOME_MESSAGE]);
        setInput("");
        setError("");
        setFailedMessage("");
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, loading]);

    async function sendMessage(message: string) {
        if (!message || loading) return;

        setInput("");
        setError("");
        setFailedMessage("");
        setLoading(true);

        setMessages((previous) => [
            ...previous,
            {
                role: "user",
                content: message,
                timestamp: new Date().toISOString(),
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
                    timestamp: new Date().toISOString(),
                },
            ]);
        } catch (err) {
            console.error("AI chat error:", err);

            setFailedMessage(message);
            setError(
                "Unable to get a response. Please check your connection and try again."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const message = input.trim();

        if (!message || loading) return;

        await sendMessage(message);
    }

    async function handleRetry() {
        if (!failedMessage || loading) return;

        const message = failedMessage;

        setMessages((previous) => previous.slice(0, -1));

        await sendMessage(message);
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
                            <div key={index} className="flex flex-col">
                                {/* Date separator */}
                                {(index === 0 ||
                                    getDateLabel(message.timestamp) !==
                                    getDateLabel(messages[index - 1].timestamp)) && (
                                        <div className="w-full py-3 text-center">
                                            <span className="rounded-full bg-slate-800 px-3 py-1 text-[10px] font-medium text-slate-400">
                                                {getDateLabel(message.timestamp)}
                                            </span>
                                        </div>
                                    )}

                                {/* Message alignment */}
                                <div
                                    className={`flex ${message.role === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                        }`}
                                >
                                    {/* Message bubble */}
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

                                        {/* Message timestamp */}
                                        <p
                                            className={`mt-2 text-[10px] leading-4 ${message.role === "user"
                                                ? "text-slate-950/60"
                                                : "text-slate-400"
                                                }`}
                                        >
                                            {new Date(message.timestamp).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Suggested questions */}
                        {messages.length === 1 &&
                            messages[0].role === "assistant" &&
                            !loading && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-slate-400">
                                        Suggested questions
                                    </p>

                                    {SUGGESTED_QUESTIONS.map((question) => (
                                        <button
                                            key={question}
                                            type="button"
                                            onClick={() => sendMessage(question)}
                                            disabled={loading}
                                            className="block w-full rounded-xl border border-slate-700 bg-[#17243a] px-3 py-2 text-left text-xs text-slate-300 transition hover:border-sky-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                                        >
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            )}

                        {loading && (
                            <div className="flex items-end gap-2" role="status">
                                {/* AI avatar */}
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-slate-950">
                                    AI
                                </div>

                                {/* Typing bubble */}
                                <div
                                    className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-slate-800 px-4 py-3"
                                    aria-label="AI assistant is typing"
                                >
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.3s]" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.15s]" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Error message */}
                    {/* Error message and retry button */}
                    {error && (
                        <div className="flex items-center justify-between gap-3 px-4 pb-3">
                            <p className="text-xs text-red-400">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={handleRetry}
                                disabled={loading}
                                className="shrink-0 rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-600 disabled:opacity-50"
                            >
                                Retry
                            </button>
                        </div>
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
