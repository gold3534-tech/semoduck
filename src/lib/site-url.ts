export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const fallback = typeof window === "undefined" ? "http://localhost:3000" : window.location.origin;

  try {
    const url = new URL(configuredUrl || fallback);
    if (url.hostname === "0.0.0.0") {
      url.hostname = "localhost";
    }
    return url.origin;
  } catch {
    return fallback.replace("0.0.0.0", "localhost");
  }
}
