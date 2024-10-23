<script lang="ts">
    import type { PageData } from './$types';
    import { searchParameters, ssp, type SubscribedSearchParams } from '$lib/utils/sveltekit-search-params';
    import type { ResourceAssignedToOwnCompany, ResourceAssignedToSelf, UserWordCount } from './+page';
    import { createManagerDashboardSorter, SortName, createUserWordCountSorter } from './dashboard-table-sorters';
    import Select from '$lib/components/Select.svelte';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import TableCell from '$lib/components/TableCell.svelte';
    import { ResourceContentStatusEnum, UserRole } from '$lib/types/base';
    import type { BasicUser } from '$lib/types/base';
    import UserSelector from '../resources/[resourceContentId]/UserSelector.svelte';
    import Modal from '$lib/components/Modal.svelte';
    import { postToApi } from '$lib/utils/http-service';
    import { formatSimpleDaysAgo } from '$lib/utils/date-time';
    import { log } from '$lib/logger';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import { filterBoolean, filterDuplicatesByKey, sortByKey } from '$lib/utils/array';
    import Table from '$lib/components/Table.svelte';
    import {
        assignedContentsColumns,
        toAssignContentsColumns,
        manageContentsColumns,
        userWordCountColumns,
    } from './manager-dashboard-columns';
    import CenteredSpinnerFullScreen from '$lib/components/CenteredSpinnerFullScreen.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';

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
            lastAssignedId: ssp.number(0),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    let userWordCountParams = {
        sort: SortName.User,
    };

    let assignToEditorUserId: number | null = null;
    let assignToReviewerUserId: number | null = null;
    let isAssignContentModalOpen = false;
    let isSendToPublisherModalOpen = false;
    let isErrorModalOpen = false;
    let customErrorMessage: string | null = null;
    let isAssigning = false;

    $: !isErrorModalOpen && (customErrorMessage = null);

    let myWorkProjectNames: string[] = [];
    let myWorkLastAssignedUsers: BasicUser[] = [];
    let toAssignProjectNames: string[] = [];
    let manageProjectNames: string[] = [];
    let manageLastAssignedUsers: BasicUser[] = [];
    let currentProjectNames: string[] = [];
    let currentLastAssignedUsers: BasicUser[] = [];
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

    const setTabContents = (
        tab: string,
        assignedUserId: number,
        toAssignProjectName: string,
        lastAssignedId: number,
        search: string
    ) => {
        if (tab === Tab.myWork) {
            currentMyWorkContents = myWorkContents.filter(
                (x) =>
                    x.englishLabel.toLowerCase().includes(search.toLowerCase()) &&
                    (toAssignProjectName === '' || x.projectName === toAssignProjectName) &&
                    (lastAssignedId === 0 || x.lastAssignedUser?.id === lastAssignedId)
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
                    (toAssignProjectName === '' || x.projectName === toAssignProjectName) &&
                    (lastAssignedId === 0 || x.lastAssignedUser?.id === lastAssignedId)
            );
        }
    };

    $: setTabContents(
        $searchParams.tab,
        $searchParams.assignedUserId,
        $searchParams.project,
        $searchParams.lastAssignedId,
        search
    );
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

        myWorkProjectNames = Array.from(new Set(filterBoolean(myWorkContents.map((c) => c.projectName)))).sort();
        myWorkLastAssignedUsers = sortByKey(
            'name',
            filterDuplicatesByKey('id', filterBoolean(myWorkContents.map((c) => c.lastAssignedUser)))
        );

        toAssignProjectNames = Array.from(new Set(filterBoolean(toAssignContents.map((c) => c.projectName)))).sort();

        manageProjectNames = Array.from(new Set(filterBoolean(manageContents.map((c) => c.projectName)))).sort();
        manageLastAssignedUsers = sortByKey(
            'name',
            filterDuplicatesByKey('id', filterBoolean(manageContents.map((c) => c.lastAssignedUser)))
        );

        // Handle situation where project is set in the searchParams but is no longer valid. E.g. saved bookmark
        // or forced refresh after assign that removed all of them.
        if (
            ($searchParams.tab === Tab.toAssign && !toAssignProjectNames.includes($searchParams.project)) ||
            ($searchParams.tab === Tab.manage && !manageProjectNames.includes($searchParams.project)) ||
            ($searchParams.tab === Tab.myWork && !myWorkProjectNames.includes($searchParams.project))
        ) {
            $searchParams.project = '';
        }

        if (
            ($searchParams.tab === Tab.manage &&
                manageLastAssignedUsers.filter((u) => u.id === $searchParams.lastAssignedId).length === 0) ||
            ($searchParams.tab === Tab.myWork &&
                myWorkLastAssignedUsers.filter((u) => u.id === $searchParams.lastAssignedId).length === 0)
        ) {
            $searchParams.lastAssignedId = 0;
        }
    };

    const switchProjectAndLastAssignedNames = (tab: string) => {
        if (tab === Tab.myWork) {
            currentProjectNames = myWorkProjectNames;
            currentLastAssignedUsers = myWorkLastAssignedUsers;
        } else if (tab === Tab.toAssign) {
            currentProjectNames = toAssignProjectNames;
        } else if (tab === Tab.manage) {
            currentProjectNames = manageProjectNames;
            currentLastAssignedUsers = manageLastAssignedUsers;
        }
    };

    const switchTabs = (tab: Tab) => {
        if ($searchParams.tab === tab) return;

        $searchParams.tab = tab;
        $searchParams.assignedUserId = 0;
        $searchParams.lastAssignedId = 0;

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
                assignedUserId: assignToEditorUserId,
                assignedReviewerUserId: assignToReviewerUserId,
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

    // eslint-disable-next-line
    let table: Table<any> | null;
    // eslint-disable-next-line
    let userWordCountTable: Table<any> | null;

    $: userWordCountParams.sort && userWordCountTable?.resetScroll();
    $: $searchParams.sort && $searchParams.tab && table?.resetScroll();

    let selectedCount = 0;
    let selectedWordCount = 0;

    function calculateSelectedCounts(
        selectedMyWorkContents: ResourceAssignedToSelf[],
        selectedToAssignContents: ResourceAssignedToSelf[],
        selectedManageContents: ResourceAssignedToOwnCompany[]
    ) {
        if ($searchParams.tab === Tab.myWork) {
            selectedCount = selectedMyWorkContents.length;
            selectedWordCount = selectedMyWorkContents.reduce((acc, x) => acc + (x.wordCount ?? 0), 0);
        } else if ($searchParams.tab === Tab.toAssign) {
            selectedCount = selectedToAssignContents.length;
            selectedWordCount = selectedToAssignContents.reduce((acc, x) => acc + (x.wordCount ?? 0), 0);
        } else if ($searchParams.tab === Tab.manage) {
            selectedCount = selectedManageContents.length;
            selectedWordCount = selectedManageContents.reduce((acc, x) => acc + (x.wordCount ?? 0), 0);
        }
    }

    $: calculateSelectedCounts(selectedMyWorkContents, selectedToAssignContents, selectedManageContents);
    $: switchProjectAndLastAssignedNames($searchParams.tab);
</script>

{#await loadContents()}
    <CenteredSpinnerFullScreen />
{:then _}
    <div class="flex flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Dashboard</h1>
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
            <Select
                class="select select-bordered max-w-[14rem] flex-grow"
                bind:value={$searchParams.project}
                onChange={resetSelections}
                isNumber={false}
                options={[{ value: '', label: 'Project' }, ...currentProjectNames.map((p) => ({ value: p, label: p }))]}
            />
            {#if $searchParams.tab === Tab.manage || $searchParams.tab === Tab.myWork}
                <Select
                    class="select select-bordered max-w-[14rem] flex-grow"
                    bind:value={$searchParams.lastAssignedId}
                    onChange={resetSelections}
                    isNumber={true}
                    options={[
                        { value: 0, label: 'Last Assigned' },
                        ...currentLastAssignedUsers.map((n) => ({ value: n.id, label: n.name })),
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
                <div class="text-sm text-gray-500">Selected Word Count: {selectedWordCount ?? 0}</div>
            </div>
        </div>

        {#if $searchParams.tab === Tab.myWork}
            <Table
                bind:this={table}
                class="my-4"
                enableSelectAll={true}
                columns={assignedContentsColumns}
                items={sortAssignedData(currentMyWorkContents, $searchParams.sort)}
                itemUrlPrefix="/resources/"
                idColumn="id"
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
        {:else if $searchParams.tab === Tab.toAssign}
            <div class="flex h-full flex-[2] grow flex-col gap-4 overflow-y-hidden xl:flex-row">
                <Table
                    bind:this={table}
                    class="my-4 max-h-[31.25rem] xl:grow"
                    enableSelectAll={true}
                    columns={toAssignContentsColumns}
                    items={sortAssignedData(currentToAssignContents, $searchParams.sort)}
                    idColumn="id"
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
                {#if userWordCounts.length > 0}
                    <Table
                        bind:this={userWordCountTable}
                        class="my-4 w-full xl:max-w-[275px]"
                        columns={userWordCountColumns}
                        items={sortUserWordCountData(userWordCounts, userWordCountParams.sort)}
                        idColumn="userId"
                        noItemsText="No Users Found."
                        bind:searchParams={userWordCountParams}
                    ></Table>
                {/if}
            </div>
        {:else if $searchParams.tab === Tab.manage}
            <div class="flex h-full flex-[2] grow flex-col gap-4 overflow-y-hidden xl:flex-row">
                <Table
                    bind:this={table}
                    class="my-4 max-h-[31.25rem] xl:grow"
                    enableSelectAll={true}
                    columns={manageContentsColumns}
                    items={sortAndFilterManageData(currentManageContents, $searchParams)}
                    idColumn="id"
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
                {#if userWordCounts.length > 0}
                    <Table
                        bind:this={userWordCountTable}
                        class="my-4 w-full xl:max-w-[275px]"
                        columns={userWordCountColumns}
                        items={sortUserWordCountData(userWordCounts, userWordCountParams.sort)}
                        idColumn="userId"
                        noItemsText="No Users Found."
                        bind:searchParams={userWordCountParams}
                    ></Table>
                {/if}
            </div>
        {/if}
    </div>
{:catch error}
    <ErrorMessage uncastError={error} />
{/await}

<Modal
    isTransacting={isAssigning}
    primaryButtonText={'Assign'}
    primaryButtonOnClick={() => updateContent(assignEditor)}
    primaryButtonDisabled={!assignToEditorUserId}
    bind:open={isAssignContentModalOpen}
    header={'Assign Resource(s)'}
>
    <h3 class="my-4 text-xl">Editor<span class="text-error">*</span></h3>
    <UserSelector
        users={data.users?.filter((u) => u.role !== UserRole.ReportViewer) ?? []}
        defaultLabel="Select Editor"
        bind:selectedUserId={assignToEditorUserId}
    />
    <h3 class="my-4 text-xl">Reviewer</h3>
    <UserSelector
        users={data.users?.filter((u) => u.role === UserRole.Reviewer || u.role === UserRole.Manager) ?? []}
        defaultLabel="Select Reviewer"
        bind:selectedUserId={assignToReviewerUserId}
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
