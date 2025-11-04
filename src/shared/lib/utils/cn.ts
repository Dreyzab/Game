import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to combine and merge CSS class names
 * Uses clsx for conditional classes and tailwind-merge for intelligent Tailwind class merging
 *
 * @param inputs - CSS class values to combine
 * @returns Merged and optimized class string
 *
 * @example
 * cn('text-red-500', 'bg-blue-500', condition && 'p-4')
 * // => 'text-red-500 bg-blue-500 p-4'
 *
 * @example
 * cn('text-red-500', 'text-blue-500') // text-blue-500 wins due to tailwind-merge
 * // => 'text-blue-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
