/**
 * Utility to resolve image URLs properly across environments:
 * - Full URLs (http://, https://, data:, blob:) are returned as-is.
 * - Relative paths like /widatra-building.jpg are returned as-is.
 * - Storage paths (/storage/...) are resolved against backend host in local dev mode,
 *   or returned directly in production (where Nginx serves /storage from same domain).
 */
export function resolveImageUrl(
  url: string | null | undefined,
  fallback: string = "/widatra-building.jpg"
): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    return fallback;
  }

  const cleanUrl = url.trim();

  if (
    cleanUrl.startsWith("http://") ||
    cleanUrl.startsWith("https://") ||
    cleanUrl.startsWith("data:") ||
    cleanUrl.startsWith("blob:")
  ) {
    return cleanUrl;
  }

  if (cleanUrl.startsWith("/storage/")) {
    if (typeof window !== "undefined" && window.location) {
      const isDev =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const isVitePort =
        window.location.port === "5173" || window.location.port === "3000";
      if (isDev && isVitePort) {
        return `http://localhost:8000${cleanUrl}`;
      }
    }
  }

  return cleanUrl;
}
