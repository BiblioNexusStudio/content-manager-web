import type { PageLoad } from './$types';
import { fetchJsonFromApiWithAuth, fetchJsonStreamingFromApi } from '$lib/utils/http-service';
import type { ResourceContent } from '$lib/types/resources';
import type { User } from '$lib/types/base';

export const load: PageLoad = async ({ params, fetch }) => {
    return {
        users: await fetchJsonFromApiWithAuth<User[]>('/admin/users', {}, fetch),
        streamedResourceContent: fetchJsonStreamingFromApi<ResourceContent>(
            `/admin/resources/content/summary/${params.resourceContentId}`,
            {},
            fetch
        ),
    };
};
