export async function apiFetch(url, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined");
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // ✅ FormData হলে Content-Type set করবে না
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error: ${res.status} → ${text}`);
  }

  if (res.status === 204) return null;

  return res.json();
}
