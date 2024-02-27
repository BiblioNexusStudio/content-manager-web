<script lang="ts">
    import type { PageData } from './$types';
    import { unwrapStreamedData } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { _ as translate } from 'svelte-i18n';
    import NewUserModal from '$lib/components/users/NewUserModal.svelte';
    import type { User } from '$lib/types/base';

    export let data: PageData;

    $: userDataPromise = unwrapStreamedData(data.userData!);
    $: companiesPromise = unwrapStreamedData(data.companies!);
    $: allDataPromise = Promise.all([userDataPromise, companiesPromise]);
    let searchInputVal: string | undefined;

    $: searchVal = searchInputVal;
    const filterUsers = (users: User[], sortVal?: string) => {
        return sortVal ? users.filter((u) => u.name.toLowerCase().includes(sortVal!.toLowerCase())) : users;
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
        <div class="mt-4 flex justify-between">
            <div class="text-3xl">{$translate('page.users.header.value')}</div>
            <div class="relative w-3/12 justify-self-end text-gray-600">
                <div class="flex">
                    <div class="flex w-2/5 items-center pr-20">
                        <button class="btn btn-primary me-4" on:click={openModal}>Add User</button>
                    </div>
                    <input
                        bind:value={searchInputVal}
                        type="search"
                        class="min-h-12 w-full rounded-md border-[1px] py-2 ps-5 text-sm text-gray-900 focus:outline-none"
                        placeholder={$translate('page.resources.searchBox.value')}
                    />
                </div>
            </div>
        </div>
        <div class="flex flex-row space-x-4 overflow-y-hidden">
            <div class="my-4 max-h-full flex-[2] overflow-y-scroll rounded border-2">
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
                        {#each filterUsers(userData, searchVal) as user (user.email)}
                            <tr>
                                <td class="p-5">{user.name}</td>
                                <td class="p-5">{user.email}</td>
                                <td class="p-5">{user.role}</td>
                                <td class="p-5">{user.company.name}</td>
                                <td class="p-5">{user.isEmailVerified ? 'Verified' : 'Invited'}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <NewUserModal {companies} {roles} header="Add User" bind:open={isModalOpen} />
{/await}
