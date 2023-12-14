import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi } from '$lib/utils/http-service';
import type { ResourceContent } from '$lib/types/resources';

export const load: PageLoad = async ({ params, fetch }) => {
    return {
        streamedResourceContent: fetchJsonStreamingFromApi<ResourceContent>(
            `/admin/resources/content/summary/${params.resourceContentId}`,
            {},
            fetch
        ),
    };
};
