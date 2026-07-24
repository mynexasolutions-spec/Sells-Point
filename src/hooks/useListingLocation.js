"use client";

import { useState } from "react";

export function useListingLocation() {
  const [locationState, setLocationState] = useState({ loading: false, message: "", kind: "idle" });

  const locate = (onSuccess) => {
    if (!navigator.geolocation) {
      setLocationState({ loading: false, kind: "error", message: "Live location is not supported in this browser. Enter your location manually." });
      return;
    }
    setLocationState({ loading: true, kind: "pending", message: "Finding your location…" });
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`/api/geocode/reverse?lat=${encodeURIComponent(coords.latitude)}&lng=${encodeURIComponent(coords.longitude)}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw Object.assign(new Error(payload.error?.message), { code: payload.error?.code });
        onSuccess(payload);
        setLocationState({ loading: false, kind: "success", message: `Using ${payload.displayName}` });
      } catch (error) {
        const fallback = error.code === "RATE_LIMITED" ? "Location lookup is busy. Please wait and retry." :
          error.code === "EMPTY_RESULT" ? "No readable location was found. Enter it manually." :
          error.code === "PROVIDER_TIMEOUT" ? "Location lookup timed out. Please retry." :
          error.message || "Location lookup failed. Your manual entry was kept.";
        setLocationState({ loading: false, kind: "error", message: fallback });
      }
    }, (error) => {
      const messages = {
        1: "Location permission was denied. You can enter it manually.",
        2: "Your location is unavailable. Check your device settings and retry.",
        3: "Finding your location timed out. Please retry.",
      };
      setLocationState({ loading: false, kind: "error", message: messages[error.code] || "Unable to find your location. Enter it manually." });
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  return { ...locationState, locate };
}
