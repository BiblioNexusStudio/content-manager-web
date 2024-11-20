import type { PageLoad } from './$types';
import { getFromApi } from '$lib/utils/http-service';
import type { ResourceContent } from '$lib/types/resources';
import { userCan, Permission } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ parent, params, fetch }) => {
    await parent();

    if (!get(userCan)(Permission.ReadResources)) {
        throw redirect(302, '/');
    }

    return {
        resourceContent: await getFromApi<ResourceContent>(`/resources/content/${params.resourceContentId}`, fetch),
    };
};
