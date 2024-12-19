import type { HandleClientError } from '@sveltejs/kit';
import { log } from '$lib/logger';

// This client-side hook runs when an error is thrown in a page.ts/layout.ts load function.
// It only exists to log exceptions to App Insights and then pass along the error to `src/routes/+error.svelte`.
export const handleError = (({ error }: { error: unknown }) => {
    log.exception(error);

    return error as Error;
}) satisfies HandleClientError;
