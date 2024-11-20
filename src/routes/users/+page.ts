import { Permission, userCan } from '$lib/stores/auth';
import { getFromApi } from '$lib/utils/http-service';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { type User, type Company, UserRole } from '$lib/types/base';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    if (get(userCan)(Permission.CreateUser) || get(userCan)(Permission.CreateUserInCompany)) {
        const [users, companies] = await Promise.all([
            getFromApi<User[]>(`/users`, fetch),
            getFromApi<Company[]>(`/companies`, fetch),
        ]);
        return {
            users,
            companies,
            roles: [UserRole.Editor, UserRole.Manager, UserRole.ReportViewer, UserRole.Reviewer],
        };
    } else {
        throw redirect(302, '/');
    }
};
