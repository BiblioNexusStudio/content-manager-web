import { Permission, userCan } from '$lib/stores/auth';
import { getFromApiWithoutBlocking } from '$lib/utils/http-service';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { type User, type Company, UserRole } from '$lib/types/base';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ parent, fetch }) => {
    await parent();

    if (get(userCan)(Permission.CreateUser) || get(userCan)(Permission.CreateUserInCompany)) {
        const userData = getFromApiWithoutBlocking<User[]>(`/users`, fetch);
        const companies = getFromApiWithoutBlocking<Company[]>(`/companies`, fetch);
        const roles = [UserRole.Editor, UserRole.Manager];
        return {
            userData,
            companies,
            roles,
        };
    } else {
        throw redirect(302, '/');
    }
};
