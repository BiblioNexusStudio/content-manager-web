import type { PageLoad } from '../$types';
import { Permission, userCan } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import type { ResourceContent } from '$lib/types/resources';

export const load: PageLoad = async ({ parent, params, url, fetch }) => {
    await parent();
    if (get(userCan)(Permission.AiSimplify)) {
        return {
            versionId: url.searchParams.get('v'),
            resourceContentId: params.resourceContentId,
            resourceContent: getFromApiWithoutBlocking<ResourceContent>(
                `/resources/content/${params.resourceContentId}`,
                fetch
            ),
        };
    } else {
        throw redirect(302, '/');
    }
};
