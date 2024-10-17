import type { HelpDocumentResponse } from '$lib/types/helpDocuments';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    const helpContents = getFromApiWithoutBlocking<HelpDocumentResponse>('/help/aquifer-cms/documents', fetch);

    return {
        helpContents,
    };
};
