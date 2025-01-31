<script lang="ts">
    import type { PageData } from './$types';
    import { _ as translate } from 'svelte-i18n';
    import NewUserModal from '$lib/components/users/NewUserModal.svelte';
    import { type User, UserRole } from '$lib/types/base';
    import { Permission, userCan, userIsEqual } from '$lib/stores/auth';
    import Select from '$lib/components/Select.svelte';
    import Modal from '$lib/components/Modal.svelte';
    import PersonDashIcon from '$lib/icons/PersonDashIcon.svelte';
    import { patchToApi } from '$lib/utils/http-service';
    import { createIsPageTransactingContext } from '$lib/context/is-page-transacting-context';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    const isPageTransacting = createIsPageTransactingContext();
    let filterBySearch: string | null = $state(null);
    let filterByCompanyId: number | null = $state(null);
    let isDisableUserModalOpen = $state(false);
    let isShowingErrorModal = $state(false);
    let isModalOpen = $state(false);

    let users = $state(data.users);
    let companies = $derived(data.companies);
    let roles = $derived(data.roles);

    const filterUsers = (users: User[], search: string | null, companyId: number | null) => {
        return users.filter(
            (u) =>
                (companyId === null || u.company.id === companyId) &&
                (search === null || u.name.toLowerCase().includes(search.toLowerCase()))
        );
    };

    let onConfirmDisableUser: (() => Promise<void>) | undefined = $state(undefined);
    const disableUser = (userId: number) => {
        isDisableUserModalOpen = true;
        onConfirmDisableUser = async () => await postDisableUser(userId);
    };

    const postDisableUser = async (userId: number) => {
        try {
            $isPageTransacting = true;
            await patchToApi(`/users/${userId}/disable`);
            users = users.filter((x) => x.id !== userId);
        } catch (e) {
            isShowingErrorModal = true;
        } finally {
            // Prevents the disable button from flashing enabled as modal is closing
            setTimeout(() => {
                $isPageTransacting = false;
            }, 100);
        }
    };

    function openModal() {
        isModalOpen = true;
    }
</script>

<svelte:head>
    <title>Users | Aquifer Admin</title>
</svelte:head>

<div class="flex flex-col overflow-y-hidden px-4">
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
            <button class="btn btn-primary" onclick={openModal}>Add</button>
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
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {#each filterUsers(users, filterBySearch, filterByCompanyId) as user (user.email)}
                        <tr class="text-xs">
                            <td class="px-5">{user.name}</td>
                            <td class="px-5">{user.email}</td>
                            <td class="px-5">{user.role}</td>
                            <td class="px-5">{user.company.name}</td>
                            <td class="px-5">{user.isEmailVerified ? 'Verified' : 'Invited'}</td>
                            <td class="px-5 text-primary">
                                {#if user.role !== UserRole.Publisher && user.role !== UserRole.Admin && !$userIsEqual(user.id)}
                                    <button
                                        data-app-insights-event-name="disable-user-button-click"
                                        class="btn btn-circle btn-link btn-xs"
                                        onclick={() => disableUser(user.id)}
                                        ><PersonDashIcon />
                                    </button>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>
<NewUserModal {companies} {roles} header="Add User" bind:open={isModalOpen} />
<Modal
    header="Confirm Disable User"
    bind:open={isDisableUserModalOpen}
    description="This user will be disabled"
    primaryButtonText="Disable User"
    primaryButtonOnClick={onConfirmDisableUser}
    isTransacting={$isPageTransacting}
/>
<Modal
    isError={true}
    header="Error disabling user"
    description="An error occurred disabling the user. Please try again later."
    bind:open={isShowingErrorModal}
/>
