import { Permission } from '$lib/stores/auth';
import { fetchJsonStreamingFromApi, type StreamedData } from '$lib/utils/http-service';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { User } from '$lib/types/users';

export const load: PageLoad = async ({ fetch, parent }) => {
    const data = await parent();

    if (!data.currentUser) {
        return {};
    }

    if (data.currentUser.can(Permission.ReadUsers)) {
        const userData = fetchJsonStreamingFromApi(`/admin/users`, {}, fetch) as StreamedData<User[]>;
        return {
            userData,
        };
    } else {
        throw redirect(301, '/');
    }
};
