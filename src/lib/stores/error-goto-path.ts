import { writable } from 'svelte/store';

/**
 * A writable store that manages error navigation paths for pages.
 * Used within `+page.ts#load` functions to configure redirect paths for 404 errors
 * and provide a "Go to ..." button for other error types.
 *
 * @example
 * // In +page.ts
 * export const load = () => {
 *   errorGotoPath.set('/dashboard');
 *   // ... rest of load logic
 * }
 */
const errorGotoPath = writable<string | null>(null);

export default errorGotoPath;
