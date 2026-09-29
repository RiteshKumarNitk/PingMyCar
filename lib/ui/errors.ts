/**
 * One user-facing vocabulary for failures. Screens show these instead of raw
 * technical errors; server messages already written for people (validation,
 * "This conversation is closed") may still be shown as-is.
 */
export type ErrorKind = 401 | 403 | 404 | 409 | 422 | 429 | 500 | "network";
type ErrorKey = `${ErrorKind}`;

export const ERROR_COPY: Record<ErrorKey, { title: string; description: string }> = {
  "401": { title: "Please sign in", description: "Your session has ended. Sign in with Google to continue." },
  "403": { title: "You don't have access", description: "Your account can't open this. If you think it should, contact support." },
  "404": { title: "Not found", description: "This page or item doesn't exist, or it has been removed." },
  "409": { title: "Couldn't complete that", description: "Something changed in the meantime. Refresh and try again." },
  "422": { title: "Check the details", description: "Some information isn't valid. Review the highlighted fields." },
  "429": { title: "Too many attempts", description: "Please wait a minute before trying again." },
  "500": { title: "Something went wrong", description: "That's on our side. Please try again in a moment." },
  network: { title: "You're offline", description: "We couldn't reach OwnerPing. Check your connection and try again." },
};

const KNOWN = new Set([401, 403, 404, 409, 422, 429]);

/** Short message for a failed request — prefers a human message from the server for 4xx. */
export function friendlyError(status: number | "network", serverMessage?: string | null): string {
  if (status !== "network" && status >= 400 && status < 500 && status !== 401 && status !== 429 && serverMessage) {
    return serverMessage;
  }
  const key: ErrorKey = status === "network" ? "network" : KNOWN.has(status) ? (String(status) as ErrorKey) : "500";
  return ERROR_COPY[key].description;
}
