export function validCoordinates(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
    Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

export function normalizeReverseGeocode(payload, fallback) {
  const address = payload?.address || {};
  const city = address.city || address.town || address.village || address.municipality || address.county || "";
  const state = address.state || address.region || "";
  const country = address.country || "";
  const displayName = [city, state, country].filter(Boolean).join(", ") || payload?.display_name || "";
  if (!displayName) return null;
  return {
    displayName,
    city,
    state,
    country,
    latitude: Number(payload.lat ?? fallback.latitude),
    longitude: Number(payload.lon ?? fallback.longitude),
  };
}
