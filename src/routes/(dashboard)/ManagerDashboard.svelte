<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { searchParameters, ssp, type SubscribedSearchParams } from '$lib/utils/sveltekit-search-params';
    import type { ResourceAssignedToOwnCompany, ResourceAssignedToSelf } from './+page';
    import { createManagerDashboardSorter, SortName } from './dashboard-table-sorters';
    import Select from '$lib/components/Select.svelte';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import TableCell from '$lib/components/TableCell.svelte';
    import { ResourceContentStatusEnum, UserRole } from '$lib/types/base';
    import UserSelector from '../resources/[resourceContentId]/UserSelector.svelte';
    import Modal from '$lib/components/Modal.svelte';
    import { postToApi } from '$lib/utils/http-service';
    import { formatSimpleDaysAgo } from '$lib/utils/date-time';
    import { log } from '$lib/logger';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import { filterBoolean } from '$lib/utils/array';
    import Table from '$lib/components/Table.svelte';
    import {
        assignedContentsColumns,
        toAssignContentsColumns,
        manageContentsColumns,
    } from './manager-dashboard-columns';

    export let data: PageData;
    let search = '';

    enum Tab {
        myWork = 'my-work',
        toAssign = 'to-assign',
        manage = 'manage',
    }

    const sortAssignedData = createManagerDashboardSorter<ResourceAssignedToSelf>();
    const sortManageData = createManagerDashboardSorter<ResourceAssignedToOwnCompany>();

    const searchParams = searchParameters(
        {
            sort: ssp.string(SortName.Days),
            tab: ssp.string(Tab.myWork),
            assignedUserId: ssp.number(0),
            project: ssp.string(''),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    let assignToUserId: number | null = null;
    let isAssignContentModalOpen = false;
    let isSendToPublisherModalOpen = false;
    let isErrorModalOpen = false;
    let customErrorMessage: string | null = null;
    let isAssigning = false;

    $: !isErrorModalOpen && (customErrorMessage = null);

    let toAssignProjectNames: string[] = [];
    let myWorkContents: ResourceAssignedToSelf[] = [];
    let selectedMyWorkContents: ResourceAssignedToSelf[] = [];
    let toAssignContents: ResourceAssignedToSelf[] = [];
    let selectedToAssignContents: ResourceAssignedToSelf[] = [];
    let manageContents: ResourceAssignedToOwnCompany[] = [];
    let selectedManageContents: ResourceAssignedToOwnCompany[] = [];
    let allTabContents: ResourceAssignedToSelf[] | ResourceAssignedToOwnCompany[] = [];

    const setTabContents = (tab: string, assignedUserId: number, toAssignProjectName: string, search: string) => {
        if (tab === Tab.myWork) {
            allTabContents = myWorkContents.filter((x) => x.englishLabel.toLowerCase().includes(search.toLowerCase()));
        } else if (tab === Tab.toAssign) {
            allTabContents = toAssignContents.filter(
                (x) =>
                    x.englishLabel.toLowerCase().includes(search.toLowerCase()) &&
                    (toAssignProjectName === '' || x.projectName === toAssignProjectName)
            );
        } else if (tab === Tab.manage) {
            allTabContents = manageContents.filter(
                (x) =>
                    (assignedUserId === 0 || x.assignedUser.id === assignedUserId) &&
                    x.englishLabel.toLowerCase().includes(search.toLowerCase())
            );
        } else {
            allTabContents = [];
        }
    };

    $: setTabContents($searchParams.tab, $searchParams.assignedUserId, $searchParams.project, search);
    $: anyRowSelected =
        selectedMyWorkContents.length > 0 || selectedToAssignContents.length > 0 || selectedManageContents.length > 0;
    $: nonManagerReviewSelected = checkManagerReviewStatus(selectedMyWorkContents);

    const checkManagerReviewStatus = (contents: ResourceAssignedToSelf[]) => {
        return contents.some(
            (x) =>
                x.statusValue !== ResourceContentStatusEnum.AquiferizeManagerReview &&
                x.statusValue !== ResourceContentStatusEnum.TranslationManagerReview
        );
    };

    const loadContents = async () => {
        const manageContentsPromise = data.managerDashboard!.manageResourceContent.promise;
        const toAssignContentsPromise = data.managerDashboard!.toAssignContent.promise;
        const assignedContentsPromise = data.managerDashboard!.assignedResourceContent.promise;

        [myWorkContents, toAssignContents, manageContents] = await Promise.all([
            assignedContentsPromise,
            toAssignContentsPromise,
            manageContentsPromise,
        ]);

        toAssignProjectNames = Array.from(new Set(filterBoolean(toAssignContents.map((c) => c.projectName)))).sort();

        // Handle situation where project is set in the searchParams but is no longer valid. E.g. saved bookmark
        // or forced refresh after assign that removed all of them.
        if (!toAssignProjectNames.includes($searchParams.project)) {
            $searchParams.project = '';
        }
    };

    const switchTabs = (tab: Tab) => {
        if ($searchParams.tab === tab) return;

        $searchParams.tab = tab;
        resetSelections();
    };

    const resetSelections = () => {
        selectedMyWorkContents = [];
        selectedToAssignContents = [];
        selectedManageContents = [];
    };

    const sortAndFilterManageData = (
        list: ResourceAssignedToSelf[] | ResourceAssignedToOwnCompany[],
        params: SubscribedSearchParams<typeof searchParams>
    ) => {
        if (params.assignedUserId === 0) {
            return sortManageData(list as ResourceAssignedToOwnCompany[], params.sort);
        }
        return sortManageData(
            (list as ResourceAssignedToOwnCompany[]).filter((r) => r.assignedUser.id === params.assignedUserId),
            params.sort
        );
    };

    const assignEditor = async (contentIds: number[]) => {
        if (contentIds.length > 0) {
            await postToApi<null>('/resources/content/assign-editor', {
                assignedUserId: assignToUserId,
                contentIds: contentIds,
            });
        }
    };

    const sendForReview = async (contentIds: number[]) => {
        if (contentIds.length > 0) {
            try {
                await postToApi<null>('/resources/content/send-for-publisher-review', {
                    contentIds: contentIds,
                });
            } catch (error) {
                log.exception(error);
                throw error;
            }
        }
    };

    async function updateContent(action: (contentIds: number[]) => Promise<void>) {
        isAssigning = true;

        try {
            const contentIds = [
                ...selectedMyWorkContents.map((x) => x.id),
                ...selectedToAssignContents.map((x) => x.id),
                ...selectedManageContents.map((x) => x.id),
            ];
            await action(contentIds);
            isAssigning = false;
            window.location.reload();
        } catch {
            isErrorModalOpen = true;
            isAssigning = false;
        }
    }

    let scrollingDiv: HTMLDivElement | undefined;
    $: $searchParams.sort && $searchParams.tab && scrollingDiv && (scrollingDiv.scrollTop = 0);
</script>

{#await loadContents()}
    <CenteredSpinner />
{:then _}
    <div class="flex max-h-screen flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Manager Dashboard</h1>
        <div class="flex flex-row items-center pt-4">
            <div role="tablist" class="tabs tabs-bordered w-fit">
                <button
                    on:click={() => switchTabs(Tab.myWork)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.myWork && 'tab-active'}"
                    >My Work ({myWorkContents.length})</button
                >
                <button
                    on:click={() => switchTabs(Tab.toAssign)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.toAssign && 'tab-active'}"
                    >To Assign ({toAssignContents.length})</button
                >
                <button
                    on:click={() => switchTabs(Tab.manage)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.manage && 'tab-active'}"
                    >Manage ({manageContents.length})</button
                >
            </div>
        </div>
        <div class="mt-4 flex gap-4">
            <input class="input input-bordered max-w-xs focus:outline-none" bind:value={search} placeholder="Search" />
            {#if $searchParams.tab === Tab.toAssign}
                <Select
                    class="select select-bordered max-w-[14rem] flex-grow"
                    bind:value={$searchParams.project}
                    onChange={resetSelections}
                    isNumber={false}
                    options={[
                        { value: '', label: 'Project' },
                        ...toAssignProjectNames.map((p) => ({ value: p, label: p })),
                    ]}
                />
            {/if}
            {#if $searchParams.tab === Tab.manage}
                <Select
                    class="select select-bordered max-w-[14rem] flex-grow"
                    bind:value={$searchParams.assignedUserId}
                    onChange={resetSelections}
                    isNumber={true}
                    options={[
                        { value: 0, label: 'Assigned' },
                        ...(data.users || []).map((u) => ({ value: u.id, label: u.name })),
                    ]}
                />
            {/if}

            <button
                data-app-insights-event-name="manager-dashboard-bulk-assign-click"
                class="btn btn-primary"
                on:click={() => (isAssignContentModalOpen = true)}
                disabled={selectedMyWorkContents.length === 0 && selectedToAssignContents.length === 0}>Assign</button
            >

            {#if $searchParams.tab === Tab.myWork}
                <Tooltip
                    position={{ left: '10rem' }}
                    text={nonManagerReviewSelected ? 'Manager Review status only' : null}
                >
                    <button
                        data-app-insights-event-name="manager-dashboard-bulk-assign-click"
                        class="btn btn-primary"
                        on:click={() => (isSendToPublisherModalOpen = true)}
                        disabled={!anyRowSelected || nonManagerReviewSelected}>Send to Publisher</button
                    >
                </Tooltip>
            {/if}
        </div>

        <div bind:this={scrollingDiv} class="my-4 max-h-full flex-[2] overflow-y-auto">
            {#if $searchParams.tab === Tab.myWork}
                <Table
                    enableSelectAll={true}
                    columns={assignedContentsColumns}
                    items={sortAssignedData(allTabContents, $searchParams.sort)}
                    itemUrlPrefix="/resources/"
                    bind:searchParams={$searchParams}
                    bind:selectedItems={selectedMyWorkContents}
                    noItemsText="Your work is all done!"
                    searchAble={true}
                    bind:searchText={search}
                    let:item
                    let:href
                    let:itemKey
                >
                    {#if itemKey === 'daysSinceContentUpdated' && item[itemKey] !== null}
                        <LinkedTableCell {href}>{formatSimpleDaysAgo(item[itemKey])}</LinkedTableCell>
                    {:else if itemKey === 'daysUntilProjectDeadline' && item[itemKey] !== null}
                        <LinkedTableCell {href} class={(item[itemKey] ?? 0) < 0 ? 'text-error' : ''}
                            >{item[itemKey] ?? ''}</LinkedTableCell
                        >
                    {:else if href !== undefined && itemKey}
                        <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                    {:else if itemKey}
                        <TableCell>{item[itemKey] ?? ''}</TableCell>
                    {/if}
                </Table>
            {:else if $searchParams.tab === Tab.toAssign}
                <Table
                    enableSelectAll={true}
                    columns={toAssignContentsColumns}
                    items={sortAssignedData(allTabContents, $searchParams.sort)}
                    bind:searchParams={$searchParams}
                    bind:selectedItems={selectedToAssignContents}
                    itemUrlPrefix="/resources/"
                    noItemsText="Your work is all done!"
                    searchAble={true}
                    bind:searchText={search}
                    let:item
                    let:href
                    let:itemKey
                >
                    {#if itemKey === 'daysSinceContentUpdated' && item[itemKey] !== null}
                        <LinkedTableCell {href}>{formatSimpleDaysAgo(item[itemKey])}</LinkedTableCell>
                    {:else if itemKey === 'daysUntilProjectDeadline' && item[itemKey] !== null}
                        <LinkedTableCell {href} class={(item[itemKey] ?? 0) < 0 ? 'text-error' : ''}
                            >{item[itemKey] ?? ''}</LinkedTableCell
                        >
                    {:else if href !== undefined && itemKey}
                        <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                    {:else if itemKey}
                        <TableCell>{item[itemKey] ?? ''}</TableCell>
                    {/if}
                </Table>
            {:else if $searchParams.tab === Tab.manage}
                <Table
                    enableSelectAll={true}
                    columns={manageContentsColumns}
                    items={sortAndFilterManageData(allTabContents, $searchParams)}
                    bind:searchParams={$searchParams}
                    bind:selectedItems={selectedManageContents}
                    itemUrlPrefix="/resources/"
                    noItemsText="Your work is all done!"
                    searchAble={true}
                    bind:searchText={search}
                    let:item
                    let:href
                    let:itemKey
                >
                    {#if itemKey === 'daysSinceContentUpdated' && item[itemKey] !== null}
                        <LinkedTableCell {href}>{formatSimpleDaysAgo(item[itemKey])}</LinkedTableCell>
                    {:else if itemKey === 'assignedUser' && item[itemKey] !== null && item[itemKey]?.name !== null}
                        <LinkedTableCell {href}>{item[itemKey]?.name}</LinkedTableCell>
                    {:else if itemKey === 'daysUntilProjectDeadline' && item[itemKey] !== null}
                        <LinkedTableCell {href} class={(item[itemKey] ?? 0) < 0 ? 'text-error' : ''}
                            >{item[itemKey] ?? ''}</LinkedTableCell
                        >
                    {:else if href !== undefined && itemKey}
                        <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                    {:else if itemKey}
                        <TableCell>{item[itemKey] ?? ''}</TableCell>
                    {/if}
                </Table>
            {/if}
        </div>
    </div>
{/await}

<Modal
    isTransacting={isAssigning}
    primaryButtonText={'Assign'}
    primaryButtonOnClick={() => updateContent(assignEditor)}
    primaryButtonDisabled={!assignToUserId}
    bind:open={isAssignContentModalOpen}
    header={'Choose a user'}
>
    <UserSelector
        users={data.users?.filter((u) => u.role === UserRole.Editor || u.role === UserRole.Manager) ?? []}
        defaultLabel="Select User"
        bind:selectedUserId={assignToUserId}
    />
</Modal>

<Modal
    isTransacting={isAssigning}
    primaryButtonText={'Send to Publisher'}
    primaryButtonOnClick={() => updateContent(sendForReview)}
    bind:open={isSendToPublisherModalOpen}
    header={'Confirm Send to Publisher'}
>
    <div class="my-4 text-xl">Have you completed your editing? Your assignment will be removed.</div>
</Modal>

<Modal
    header="Error"
    bind:open={isErrorModalOpen}
    isError={true}
    description={customErrorMessage || 'Error while assigning content.'}
/>
