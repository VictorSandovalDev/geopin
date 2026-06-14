import clsx, { type ClassValue } from "clsx";

/**
 * Merge utility class names. Tiny wrapper over clsx so consumers don't need
 * the dep directly and we can swap for tailwind-merge later if needed.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
