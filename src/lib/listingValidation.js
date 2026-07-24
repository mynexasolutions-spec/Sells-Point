const CONDITIONS = new Set(["New", "Like New", "Excellent", "Good", "Fair"]);

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function coordinate(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

export function validateListingInput(input = {}) {
  input = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const fieldErrors = {};
  const title = text(input.title);
  const description = text(input.description);
  const category = text(input.category);
  const condition = text(input.condition);
  const location = text(input.location);
  const price = Number(input.price);
  const images = input.images ?? [];
  const latitude = coordinate(input.latitude);
  const longitude = coordinate(input.longitude);

  if (title.length < 2 || title.length > 120) fieldErrors.title = "Title must be 2–120 characters.";
  if (description.length < 10 || description.length > 2000) fieldErrors.description = "Description must be 10–2,000 characters.";
  if (!category) fieldErrors.category = "Choose a category.";
  if (!CONDITIONS.has(condition)) fieldErrors.condition = "Choose a valid condition.";
  if (!Number.isFinite(price) || price <= 0) fieldErrors.price = "Enter a price greater than zero.";
  if (location.length < 2 || location.length > 160 || /^current location$/i.test(location)) {
    fieldErrors.location = "Enter a human-readable city, state, or area.";
  }
  if (!Array.isArray(images) || images.length > 6 || images.some((image) => typeof image !== "string" || !image.trim())) {
    fieldErrors.images = "Add no more than six valid images.";
  }
  if ((latitude === null) !== (longitude === null)) {
    fieldErrors.location = "Latitude and longitude must be provided together.";
  } else {
    if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) fieldErrors.latitude = "Latitude must be between -90 and 90.";
    if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) fieldErrors.longitude = "Longitude must be between -180 and 180.";
  }

  return {
    valid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    value: {
      ...input,
      title,
      description,
      category,
      condition,
      location,
      price,
      images: Array.isArray(images) ? images : [],
      latitude,
      longitude,
    },
  };
}
