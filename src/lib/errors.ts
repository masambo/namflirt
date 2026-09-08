import { ConvexError } from "convex/values";

export function errorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ConvexError) {
    if (typeof error.data === "string") return error.data;
    if (error.data && typeof error.data === "object" && typeof error.data.message === "string")
      return error.data.message;
  }
  if (error instanceof Error && !error.message.includes("[CONVEX")) return error.message;
  return fallback;
}
