/**
 * AI Gate - Single source of truth for AI feature enablement
 * All AI features must check this gate before enabling UI or functionality
 */

export function aiEnabled(): boolean {
  return typeof window !== "undefined" && localStorage.getItem("ai.enabled") === "1";
}

export function getSessionKey(): string {
  return typeof window !== "undefined" 
    ? sessionStorage.getItem("ai.key.session") ?? "" 
    : "";
}

export function getMaskedKey(): string {
  return typeof window !== "undefined"
    ? localStorage.getItem("ai.key.masked") ?? ""
    : "";
}

