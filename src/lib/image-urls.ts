export function parseImageUrls(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return [];

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      // Fall through to delimiter parsing.
    }
  }

  return raw
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function firstImageUrl(value?: string | null) {
  return parseImageUrls(value)[0] ?? "";
}
