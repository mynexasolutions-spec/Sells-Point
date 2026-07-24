export const CONTACT_CATEGORIES = [
  "support",
  "safety",
  "account",
  "listing",
  "payment",
  "partnership",
  "feedback",
  "other",
];

export const CONTACT_STATUSES = ["new", "in_progress", "resolved"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeInquiryInput(input = {}) {
  return {
    name: String(input.name || "").trim(),
    email: String(input.email || "")
      .trim()
      .toLowerCase(),
    phone: String(input.phone || "").trim(),
    category: String(input.category || "")
      .trim()
      .toLowerCase(),
    message: String(input.message || "").trim(),
    website: String(input.website || "").trim(),
  };
}

export function validateContactInquiry(input) {
  const values = normalizeInquiryInput(input);
  const fieldErrors = {};

  if (values.name.length < 2 || values.name.length > 100) {
    fieldErrors.name = "Enter a name between 2 and 100 characters.";
  }
  if (!values.email || values.email.length > 254 || !EMAIL_PATTERN.test(values.email)) {
    fieldErrors.email = "Enter a valid email address.";
  }
  if (values.phone && (values.phone.length < 7 || values.phone.length > 20)) {
    fieldErrors.phone = "Phone number must be between 7 and 20 characters.";
  }
  if (!CONTACT_CATEGORIES.includes(values.category)) {
    fieldErrors.category = "Choose an enquiry category.";
  }
  if (values.message.length < 10 || values.message.length > 2000) {
    fieldErrors.message = "Message must be between 10 and 2,000 characters.";
  }

  return {
    ok: Object.keys(fieldErrors).length === 0,
    values,
    fieldErrors,
  };
}
