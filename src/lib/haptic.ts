// Android vibration API — no-ops silently on iOS (not supported)
export function haptic(style: "light" | "medium" | "heavy" = "light") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const ms = { light: 8, medium: 20, heavy: 40 };
    navigator.vibrate(ms[style]);
  }
}
