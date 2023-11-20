import config from '$lib/config';
import type { PageLoad } from './$types';
import { fetchWrapper } from '$lib/utils/http-service';

export const load: PageLoad = async ({ params }) => {
    let resource = await fetchWrapper(`${config.PUBLIC_AQUIFER_API_URL}/resources/summary/${params.resourceId}`);
    resource = await resource.json();

    return { resource };
};
