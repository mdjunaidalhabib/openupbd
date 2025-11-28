// frontend/utils/api.js
export async function apiFetch(path, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const url = `${baseUrl}${path}`;

  try {
    const res = await fetch(url, {
      credentials: "include", // ✅ কুকি সবসময় পাঠাবে
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!res.ok) {
      let errorText = "";
      try {
        errorText = await res.text();
      } catch {
        errorText = "Unknown error";
      }

      // ❌ console.error বাদ → শুধু error throw করবো
      throw new Error(
        `API error: ${res.status} ${res.statusText} → ${errorText}`
      );
    }

    // ✅ সবসময় JSON ফেরত দেবে
    return await res.json();
  } catch (err) {
    // ❌ console.error বাদ
    // caller (Navbar, ProductPage ইত্যাদি) নিজে handle করবে
    throw err;
  }
}
