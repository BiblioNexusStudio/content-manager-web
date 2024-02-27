import type { LayoutLoad } from './$types';
import { waitLocale } from 'svelte-i18n';
import { initI18n } from '$lib/i18n';
import { fetchJsonFromApiWithAuth } from '$lib/utils/http-service';
import type { Language, ResourceContentStatus, ResourceType, User, CurrentUser } from '$lib/types/base';
import { initAuth0, Permission, setCurrentUser, userCan } from '$lib/stores/auth';
import { sortByKey } from '$lib/utils/sorting';
import { get } from 'svelte/store';

export const ssr = false;

export const load: LayoutLoad = async ({ fetch, url }) => {
    await initAuth0(url);

    const [languages, resourceTypes, resourceContentStatuses, currentUser] = await Promise.all([
        fetchJsonFromApiWithAuth<Language[]>('/languages', {}, fetch),
        fetchJsonFromApiWithAuth<ResourceType[]>('/resources/parent-resources', {}, fetch),
        fetchJsonFromApiWithAuth<ResourceContentStatus[]>('/admin/resources/content/statuses', {}, fetch),
        fetchJsonFromApiWithAuth<CurrentUser>('/users/self', {}, fetch),
    ]);

    let users: User[] | null = null;

    setCurrentUser(currentUser);

    if (get(userCan)(Permission.ReadUsers)) {
        users = await fetchJsonFromApiWithAuth<User[]>('/users', {}, fetch);
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
