export function makeImageUrl(path) {
  if (!path) return "/placeholder.png"; // fallback

  return path.startsWith("http")
    ? path
    : `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}
