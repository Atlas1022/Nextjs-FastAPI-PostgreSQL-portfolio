
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured.");
}

// Custom API error with HTTP status
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new ApiError(
      errorData?.detail || `API request failed: ${response.status}`,
      response.status
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
