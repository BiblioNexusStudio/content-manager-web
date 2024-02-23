import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi } from '$lib/utils/http-service';
import type { ResourceContent } from '$lib/types/resources';

export const load: PageLoad = async ({ params, fetch }) => {
    return {
        resourceContentId: params.resourceContentId,
        streamedResourceContent: fetchJsonStreamingFromApi<ResourceContent>(
            `/resources/content/${params.resourceContentId}`,
            {},
            fetch
        ),
    };
};
