import type { LayoutLoad } from './$types';
import { waitLocale } from 'svelte-i18n';
import { initI18n } from '$lib/i18n';
import { getFromApi } from '$lib/utils/http-service';
import type { Language, ResourceContentStatus, ResourceType, User, CurrentUser } from '$lib/types/base';
import { initAuth0, Permission, setCurrentUser, userCan } from '$lib/stores/auth';
import { sortByKey } from '$lib/utils/sorting';
import { get } from 'svelte/store';

export const ssr = false;

export const load: LayoutLoad = async ({ url }) => {
    await initAuth0(url);

    const [languages, resourceTypes, resourceContentStatuses, currentUser] = await Promise.all([
        getFromApi<Language[]>('/languages'),
        getFromApi<ResourceType[]>('/resources/parent-resources'),
        getFromApi<ResourceContentStatus[]>('/admin/resources/content/statuses'),
        getFromApi<CurrentUser>('/users/self'),
    ]);

    let users: User[] | null = null;

    setCurrentUser(currentUser);

    if (get(userCan)(Permission.ReadUsers)) {
        users = await getFromApi<User[]>('/users');
    }

    await initI18n();
    await waitLocale();

    return {
        languages: sortByKey(languages, 'englishDisplay') as Language[],
        resourceTypes: resourceTypes as ResourceType[],
        resourceContentStatuses: resourceContentStatuses as ResourceContentStatus[],
        currentUser: currentUser as CurrentUser,
        users: sortByKey(users, 'name'),
    };
};
