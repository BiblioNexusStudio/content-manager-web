import type { PageLoad } from './$types';
import { fetchJsonStreamingFromApi } from '$lib/utils/http-service';
import type { Resource } from '$lib/types/resources';

export const load: PageLoad = async ({ params, fetch }) => {
    return {
        streamedResource: fetchJsonStreamingFromApi<Resource>(`/resources/summary/${params.resourceId}`, {}, fetch),
    };
};
