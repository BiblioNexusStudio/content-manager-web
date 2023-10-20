import config from '$lib/config';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
    let resource = await fetch(`${config.PUBLIC_AQUIFER_API_URL}/resources/summary/${params.resourceId}`);
    resource = await resource.json();

    return { resource };
};
