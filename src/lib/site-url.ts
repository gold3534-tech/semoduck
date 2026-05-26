export function getSiteUrl() {
  const fallback =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
      : window.location.origin;

  try {
    const url = new URL(fallback);
    if (url.hostname === "0.0.0.0") {
      url.hostname = "localhost";
    }
    return url.origin;
  } catch {
    return fallback.replace("0.0.0.0", "localhost");
  }
}
