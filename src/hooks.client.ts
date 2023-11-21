import type { HandleClientError } from '@sveltejs/kit';
import { log } from '$lib/logger';

// From the SvelteKit docs:
//   This client-side hook runs when an unexpected error is thrown while navigating.
//   If an unexpected error is thrown during loading or the following render, this function will be called with the error and the event.
export const handleError = (async ({ error }: { error: Error }) => {
    log.exception(error);

    // eslint-disable-next-line
    // @ts-ignore
}) satisfies HandleClientError;
