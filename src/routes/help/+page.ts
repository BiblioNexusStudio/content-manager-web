import type { HelpDocumentResponse } from '$lib/types/helpDocuments';
import { getFromApi } from '$lib/utils/http-service';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    return {
        helpContents: getFromApi<HelpDocumentResponse>('/help/aquifer-cms/documents', fetch),
    };
};
