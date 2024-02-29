import type { PageLoad } from './$types';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { ResourceContent } from '$lib/types/resources';

export const load: PageLoad = async ({ params }) => {
    return {
        resourceContentId: params.resourceContentId,
        resourceContent: getFromApiWithoutBlocking<ResourceContent>(`/resources/content/${params.resourceContentId}`),
    };
};
