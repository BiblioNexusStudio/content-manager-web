<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { searchParameters, ssp, type SubscribedSearchParams } from '$lib/utils/sveltekit-search-params';
    import type { ResourceAssignedToOwnCompany, ResourceAssignedToSelf, UserWordCount } from './+page';
    import { createManagerDashboardSorter, SortName, createUserWordCountSorter } from './dashboard-table-sorters';
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
        userWordCountColumns,
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
    const sortUserWordCountData = createUserWordCountSorter();

    const searchParams = searchParameters(
        {
            sort: ssp.string(SortName.Days),
            tab: ssp.string(Tab.myWork),
            assignedUserId: ssp.number(0),
            project: ssp.string(''),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    const searchParamsForUserWordCount = searchParameters(
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
    let currentMyWorkContents: ResourceAssignedToSelf[] = [];
    let selectedMyWorkContents: ResourceAssignedToSelf[] = [];

    let toAssignContents: ResourceAssignedToSelf[] = [];
    let currentToAssignContents: ResourceAssignedToSelf[] = [];
    let selectedToAssignContents: ResourceAssignedToSelf[] = [];

    let manageContents: ResourceAssignedToOwnCompany[] = [];
    let currentManageContents: ResourceAssignedToOwnCompany[] = [];
    let selectedManageContents: ResourceAssignedToOwnCompany[] = [];

    let userWordCounts: UserWordCount[] = [];

    const setTabContents = (tab: string, assignedUserId: number, toAssignProjectName: string, search: string) => {
        if (tab === Tab.myWork) {
            currentMyWorkContents = myWorkContents.filter(
                (x) =>
                    x.englishLabel.toLowerCase().includes(search.toLowerCase()) &&
                    (toAssignProjectName === '' || x.projectName === toAssignProjectName)
            );
        } else if (tab === Tab.toAssign) {
            currentToAssignContents = toAssignContents.filter(
                (x) =>
                    x.englishLabel.toLowerCase().includes(search.toLowerCase()) &&
                    (toAssignProjectName === '' || x.projectName === toAssignProjectName)
            );
        } else if (tab === Tab.manage) {
            currentManageContents = manageContents.filter(
                (x) =>
                    (assignedUserId === 0 || x.assignedUser.id === assignedUserId) &&
                    x.englishLabel.toLowerCase().includes(search.toLowerCase()) &&
                    (toAssignProjectName === '' || x.projectName === toAssignProjectName)
            );
        }
    };

    $: setTabContents($searchParams.tab, $searchParams.assignedUserId, $searchParams.project, search);
    $: anyRowSelected =
        selectedMyWorkContents.length > 0 || selectedToAssignContents.length > 0 || selectedManageContents.length > 0;
    $: nonManagerReviewSelected = selectedMyWorkContents.some(
        (x) =>
            ![
                ResourceContentStatusEnum.AquiferizeManagerReview,
                ResourceContentStatusEnum.TranslationManagerReview,
            ].includes(x.statusValue)
    );

    const loadContents = async () => {
        const manageContentsPromise = data.managerDashboard!.manageResourceContent.promise;
        const toAssignContentsPromise = data.managerDashboard!.toAssignContent.promise;
        const assignedContentsPromise = data.managerDashboard!.assignedResourceContent.promise;
        const userWordCountsPromise = data.managerDashboard!.assignedUsersWordCount.promise;

        [myWorkContents, toAssignContents, manageContents, userWordCounts] = await Promise.all([
            assignedContentsPromise,
            toAssignContentsPromise,
            manageContentsPromise,
            userWordCountsPromise,
        ]);
    };

    const setToAssignProjectNames = (tab: string) => {
        if (tab === Tab.toAssign) {
            toAssignProjectNames = Array.from(
                new Set(filterBoolean(toAssignContents.map((c) => c.projectName)))
            ).sort();
        } else if (tab === Tab.myWork) {
            toAssignProjectNames = Array.from(new Set(filterBoolean(myWorkContents.map((c) => c.projectName)))).sort();
        } else if (tab === Tab.manage) {
            toAssignProjectNames = Array.from(new Set(filterBoolean(manageContents.map((c) => c.projectName)))).sort();
        }

        if (toAssignProjectNames.length && !toAssignProjectNames.includes($searchParams.project)) {
            $searchParams.project = '';
        }
    };

    $: setToAssignProjectNames($searchParams.tab);

    const switchTabs = (tab: Tab) => {
        if ($searchParams.tab === tab) return;

        $searchParams.tab = tab;
        $searchParams.project = '';
        resetSelections();
    };

    const resetSelections = () => {
        selectedMyWorkContents = [];
        selectedToAssignContents = [];
        selectedManageContents = [];
    };

    const sortAndFilterManageData = (
        list: ResourceAssignedToOwnCompany[],
        params: SubscribedSearchParams<typeof searchParams>
    ) => {
        if (params.assignedUserId === 0) {
            return sortManageData(list, params.sort);
        }
        return sortManageData(
            list.filter((r) => r.assignedUser.id === params.assignedUserId),
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
    let userWordCountScrollingDiv: HTMLDivElement | undefined;
    $: $searchParamsForUserWordCount.sort &&
        $searchParamsForUserWordCount.tab &&
        userWordCountScrollingDiv &&
        (userWordCountScrollingDiv.scrollTop = 0);

    $: $searchParams.sort && $searchParams.tab && scrollingDiv && (scrollingDiv.scrollTop = 0);

    let selectedCount = 0;
    let selectedWordcount = 0;

    function updateSelectedCountAndWordCount(
        tab: string,
        selectedToAssignItemsCount: number,
        selectedToAssignWordCount: number,
        selectedMyWorkItemsCount: number,
        selectedMyWorkWordCount: number,
        selectedManageItemsCount: number,
        selectedManageWordCount: number
    ) {
        if (tab === Tab.myWork) {
            selectedCount = selectedMyWorkItemsCount;
            selectedWordcount = selectedMyWorkWordCount;
        } else if (tab === Tab.toAssign) {
            selectedCount = selectedToAssignItemsCount;
            selectedWordcount = selectedToAssignWordCount;
        } else if (tab === Tab.manage) {
            selectedCount = selectedManageItemsCount;
            selectedWordcount = selectedManageWordCount;
        }
    }

    $: updateSelectedCountAndWordCount(
        $searchParams.tab,
        selectedToAssignContents.length,
        selectedToAssignContents.reduce((acc, x) => acc + (x.wordCount ?? 0), 0),
        selectedMyWorkContents.length,
        selectedMyWorkContents.reduce((acc, x) => acc + (x.wordCount ?? 0), 0),
        selectedManageContents.length,
        selectedManageContents.reduce((acc, x) => acc + (x.wordCount ?? 0), 0)
    );
</script>

{#await loadContents()}
    <CenteredSpinner />
{:then _}
    <div class="flex max-h-screen flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Manager Dashboard</h1>
        <div class="flex flex-row items-center pt-4">
            <div role="tablist" class="tabs-bordered tabs w-fit">
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
                disabled={selectedMyWorkContents.length === 0 &&
                    selectedToAssignContents.length === 0 &&
                    selectedManageContents.length === 0}>Assign</button
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
            <div class="my-1 ml-auto flex flex-col items-end justify-center">
                <div class="text-sm text-gray-500">Selected Items: {selectedCount ?? 0}</div>
                <div class="text-sm text-gray-500">Selected Word Count: {selectedWordcount ?? 0}</div>
            </div>
        </div>

        {#if $searchParams.tab === Tab.myWork}
            <div bind:this={scrollingDiv} class="my-4 max-h-full flex-[2] overflow-y-auto">
                <Table
                    enableSelectAll={true}
                    columns={assignedContentsColumns}
                    items={sortAssignedData(currentMyWorkContents, $searchParams.sort)}
                    itemUrlPrefix="/resources/"
                    bind:searchParams={$searchParams}
                    bind:selectedItems={selectedMyWorkContents}
                    noItemsText="Your work is all done!"
                    searchable={true}
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
                    {:else if itemKey === 'lastAssignedUser'}
                        <LinkedTableCell {href}>{item[itemKey]?.name ?? ''}</LinkedTableCell>
                    {:else if href !== undefined && itemKey}
                        <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                    {:else if itemKey}
                        <TableCell>{item[itemKey] ?? ''}</TableCell>
                    {/if}
                </Table>
            </div>
        {:else if $searchParams.tab === Tab.toAssign}
            <div class="flex h-full flex-[2] grow flex-col gap-4 overflow-y-hidden xl:flex-row">
                <div bind:this={scrollingDiv} class="my-4 max-h-[500px] overflow-y-scroll xl:max-h-full xl:grow">
                    <Table
                        enableSelectAll={true}
                        columns={toAssignContentsColumns}
                        items={sortAssignedData(currentToAssignContents, $searchParams.sort)}
                        bind:searchParams={$searchParams}
                        bind:selectedItems={selectedToAssignContents}
                        itemUrlPrefix="/resources/"
                        noItemsText="Your work is all done!"
                        searchable={true}
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
                </div>
                {#if userWordCounts.length > 0}
                    <div
                        bind:this={userWordCountScrollingDiv}
                        class="my-4 w-full overflow-y-scroll xl:max-h-full xl:max-w-[275px]"
                    >
                        <Table
                            columns={userWordCountColumns}
                            items={sortUserWordCountData(userWordCounts, $searchParamsForUserWordCount.sort)}
                            noItemsText="No Users Found."
                            bind:searchParams={$searchParamsForUserWordCount}
                        ></Table>
                    </div>
                {/if}
            </div>
        {:else if $searchParams.tab === Tab.manage}
            <div bind:this={scrollingDiv} class="my-4 max-h-full flex-[2] overflow-y-auto">
                <Table
                    enableSelectAll={true}
                    columns={manageContentsColumns}
                    items={sortAndFilterManageData(currentManageContents, $searchParams)}
                    bind:searchParams={$searchParams}
                    bind:selectedItems={selectedManageContents}
                    itemUrlPrefix="/resources/"
                    noItemsText={$searchParams.assignedUserId === 0
                        ? 'Your work is all done!'
                        : 'Nothing assigned to this user.'}
                    searchable={true}
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
                    {:else if itemKey === 'lastAssignedUser'}
                        <LinkedTableCell {href}>{item[itemKey]?.name ?? ''}</LinkedTableCell>
                    {:else if href !== undefined && itemKey}
                        <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                    {:else if itemKey}
                        <TableCell>{item[itemKey] ?? ''}</TableCell>
                    {/if}
                </Table>
            </div>
        {/if}
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
