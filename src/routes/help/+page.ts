import type { HelpDocumentResponse } from '$lib/types/helpDocuments';
import { getFromApi } from '$lib/utils/http-service';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    const promise = getFromApi<HelpDocumentResponse>('/help/aquifer-cms/documents', fetch);

    return {
        // by returning a nested object here, SvelteKit won't await the promise before rendering the
        // +page.svelte and instead we can await the promise on the page to show a skeleton UI
        // TODO: when upgrading to SvelteKit 2 the nested part isn't necessary, just return the unresolved promise
        helpContents: { promise },
    };
};
