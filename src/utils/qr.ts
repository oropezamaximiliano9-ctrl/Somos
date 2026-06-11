/**
 * Custom QR Code utility functions for SOMOS
 */

/**
 * Extracts and cleans the Bag ID from any scanned QR raw value.
 * Supports:
 * 1. Plain IDs: "BOLSA-001", "SMS-002"
 * 2. Path-based URLs: "https://somos-app.com/bolsa/BOLSA-001" or with trailing slash /
 * 3. Query param URLs: "https://somos-app.com/?bagId=BOLSA-001" or "?bagId=BOLSA-001" or with other params
 * 4. Path-based URLs with query params/hashes: "https://somos-app.com/bolsa/BOLSA-022?ref=1"
 */
export function extractBagId(value: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();

  // Try parsing as standard URL
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      
      // Case 1: URL contains path /bolsa/:id
      const matches = url.pathname.match(/\/bolsa\/([^/]+)/);
      if (matches && matches[1]) {
        return decodeURIComponent(matches[1].trim());
      }

      // Case 2: URL contains query param ?bagId=...
      const bagIdParam = url.searchParams.get("bagId");
      if (bagIdParam) {
        return bagIdParam.trim();
      }
    }
  } catch (error) {
    // Fallback to manual parsing on URL parsing exceptions
  }

  // Fallback string matching for partial URIs or malformed URLs
  if (trimmed.includes("/bolsa/")) {
    const parts = trimmed.split("/bolsa/");
    if (parts.length > 1) {
      // Split by queries, hashes, or trailing slash to get exact ID
      const targetSegment = parts[1].split("?")[0].split("#")[0].split("/")[0];
      if (targetSegment) {
        return decodeURIComponent(targetSegment.trim());
      }
    }
  }

  if (trimmed.includes("bagId=")) {
    const parts = trimmed.split("bagId=");
    if (parts.length > 1) {
      const targetSegment = parts[1].split("&")[0].split("#")[0].split("/")[0];
      if (targetSegment) {
        return decodeURIComponent(targetSegment.trim());
      }
    }
  }

  // If it's a plain string ID (e.g. "BOLSA-001" or "BOLSA-002") and doesn't look like a URL
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.includes("/")) {
    return trimmed;
  }

  return null;
}
