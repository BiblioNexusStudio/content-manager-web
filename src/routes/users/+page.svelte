<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { _ as translate } from 'svelte-i18n';
    import NewUserModal from '$lib/components/users/NewUserModal.svelte';
    import type { User } from '$lib/types/base';
    import { Permission, userCan } from '$lib/stores/auth';
    import Select from '$lib/components/Select.svelte';

    export let data: PageData;

    $: allDataPromise = Promise.all([data.userData!.promise, data.companies!.promise]);

    let filterBySearch: string | null = null;
    let filterByCompanyId: number | null = null;

    const filterUsers = (users: User[], search: string | null, companyId: number | null) => {
        return users.filter(
            (u) =>
                (companyId === null || u.company.id === companyId) &&
                (search === null || u.name.toLowerCase().includes(search.toLowerCase()))
        );
    };
    $: isModalOpen = false;

    $: roles = data.roles!;

    async function openModal() {
        isModalOpen = true;
    }
</script>

{#await allDataPromise}
    <CenteredSpinner />
{:then [userData, companies]}
    <div class="flex max-h-screen flex-col overflow-y-hidden px-4">
        <div class="my-4">
            <div class="text-3xl">{$translate('page.users.header.value')}</div>
        </div>
        <div class="flex justify-between">
            <div class="flex w-1/2 space-x-8">
                {#if $userCan(Permission.ReadAllUsers)}
                    <Select
                        class="select select-bordered max-w-xs"
                        options={[
                            { value: null, label: 'Select Company' },
                            ...companies.map((c) => ({ value: c.id, label: c.name })),
                        ]}
                        isNumber={true}
                        bind:value={filterByCompanyId}
                    />
                {/if}
                <input
                    bind:value={filterBySearch}
                    type="search"
                    class="min-h-12 w-[320px] rounded-md border-[1px] py-2 ps-5 text-sm text-gray-900 focus:outline-none"
                    placeholder={$translate('page.resources.searchBox.value')}
                />
                <button class="btn btn-primary" on:click={openModal}>Add</button>
            </div>
        </div>
        <div class="flex flex-row space-x-4 overflow-y-hidden">
            <div class="my-4 max-h-full flex-[2] overflow-y-auto rounded border-2">
                <table class="table table-pin-rows">
                    <thead>
                        <tr class="bg-base-200">
                            <th>{$translate('page.users.name.value')}</th>
                            <th>{$translate('page.users.email.value')}</th>
                            <th>{$translate('page.users.role.value')}</th>
                            <th>{$translate('page.users.company.value')}</th>
                            <th>{$translate('page.users.status.value')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filterUsers(userData, filterBySearch, filterByCompanyId) as user (user.email)}
                            <tr class="text-xs">
                                <td class="px-5">{user.name}</td>
                                <td class="px-5">{user.email}</td>
                                <td class="px-5">{user.role}</td>
                                <td class="px-5">{user.company.name}</td>
                                <td class="px-5">{user.isEmailVerified ? 'Verified' : 'Invited'}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <NewUserModal {companies} {roles} header="Add User" bind:open={isModalOpen} />
{/await}
