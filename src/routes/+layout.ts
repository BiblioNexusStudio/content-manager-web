import type { LayoutLoad } from './$types';
import { waitLocale } from 'svelte-i18n';
import { initI18n } from '$lib/i18n';
import { getFromApi } from '$lib/utils/http-service';
import type { Language, ResourceContentStatus, ParentResource, User, CurrentUser } from '$lib/types/base';
import { initAuth0, Permission, setCurrentUser, userCan } from '$lib/stores/auth';
import { sortByKey } from '$lib/utils/sorting';
import { get } from 'svelte/store';
import { error } from '@sveltejs/kit';

export const ssr = false;

export const load: LayoutLoad = async ({ url, fetch }) => {
    const isAuthenticated = await initAuth0(url);

    // this is not actually shown anywhere, since if the user is not authenticated then they'll be logged out.
    // it's only here to prevent logout loops if we were to call the fetches below.
    if (!isAuthenticated) {
        error(401, 'Unauthenticated');
    }

    const [languages, parentResources, resourceContentStatuses, currentUser] = await Promise.all([
        getFromApi<Language[]>('/languages', fetch),
        getFromApi<ParentResource[]>('/resources/parent-resources', fetch),
        getFromApi<ResourceContentStatus[]>('/resources/content/statuses', fetch),
        getFromApi<CurrentUser>('/users/self', fetch),
    ]);

    let users: User[] | null = null;

    setCurrentUser(currentUser);

    if (get(userCan)(Permission.ReadUsers)) {
        users = await getFromApi<User[]>('/users', fetch);
    }

    await initI18n();
    await waitLocale();

    return {
        languages: sortByKey(languages, 'englishDisplay') as Language[],
        parentResources: parentResources,
        resourceContentStatuses: resourceContentStatuses,
        currentUser: currentUser,
        users: sortByKey(users, 'name'),
    };
};
