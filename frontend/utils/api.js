export async function apiFetch(url, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4000";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text(); // full response দেখার জন্য
    throw new Error(`API error: ${res.status} → ${text}`);
  }

  if (res.status === 204) return null;
  return res.json();
}
