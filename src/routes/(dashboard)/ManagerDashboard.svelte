<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { searchParameters, ssp, type SubscribedSearchParams } from '$lib/utils/sveltekit-search-params';
    import type { ResourceAssignedToOwnCompany, ResourceAssignedToSelf } from './+page';
    import SortingTableHeaderCell from '$lib/components/SortingTableHeaderCell.svelte';
    import { createManagerDashboardSorter } from './dashboard-table-sorters';
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

    export let data: PageData;
    let search = '';

    enum Tab {
        myWork = 'my-work',
        toAssign = 'to-assign',
        manage = 'manage',
    }

    const SORT_KEYS = {
        days: 'days',
        wordCount: 'word-count',
        title: 'title',
    };

    const sortAssignedData = createManagerDashboardSorter<ResourceAssignedToSelf>();
    const sortManageData = createManagerDashboardSorter<ResourceAssignedToOwnCompany>();

    const searchParams = searchParameters(
        {
            sort: ssp.string(SORT_KEYS.days),
            tab: ssp.string(Tab.myWork),
            assignedUserId: ssp.number(0),
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

    let myWorkContents: ResourceAssignedToSelf[] = [];
    let toAssignContents: ResourceAssignedToSelf[] = [];
    let manageContents: ResourceAssignedToOwnCompany[] = [];
    let allTabContents: ResourceAssignedToSelf[] | ResourceAssignedToOwnCompany[] = [];

    const setTabContents = (tab: string, assignedUserId: number, search: string) => {
        if (tab === Tab.myWork) {
            allTabContents = myWorkContents.filter((x) => x.englishLabel.toLowerCase().includes(search.toLowerCase()));
        } else if (tab === Tab.toAssign) {
            allTabContents = toAssignContents.filter((x) =>
                x.englishLabel.toLowerCase().includes(search.toLowerCase())
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

    $: setTabContents($searchParams.tab, $searchParams.assignedUserId, search);
    $: anyRowSelected = allTabContents.some((x) => x.rowSelected);
    $: nonManagerReviewSelected = allTabContents.some(
        (x) =>
            x.rowSelected &&
            x.statusValue !== ResourceContentStatusEnum.AquiferizeManagerReview &&
            x.statusValue !== ResourceContentStatusEnum.TranslationManagerReview
    );
    $: allRowsSelected = allTabContents.length > 0 && allTabContents.every((x) => x.rowSelected);

    const loadContents = async () => {
        const manageContentsPromise = data.managerDashboard!.manageResourceContent.promise;
        const toAssignContentsPromise = data.managerDashboard!.toAssignContent.promise;
        const assignedContentsPromise = data.managerDashboard!.assignedResourceContent.promise;

        [myWorkContents, toAssignContents, manageContents] = await Promise.all([
            assignedContentsPromise,
            toAssignContentsPromise,
            manageContentsPromise,
        ]);
    };

    const switchTabs = (tab: Tab) => {
        if ($searchParams.tab === tab) return;

        $searchParams.tab = tab;
        resetSelections();
    };

    const resetSelections = () => {
        for (const content of allTabContents) {
            content.rowSelected = false;
        }
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

    function onSelectAll() {
        const allSelected = allTabContents.every((x) => x.rowSelected);
        for (const content of allTabContents) {
            content.rowSelected = !allSelected;
        }

        allTabContents = allTabContents;
    }

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
            const contentIds = allTabContents.filter((x) => x.rowSelected).map((x) => x.id);
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
                disabled={!anyRowSelected}>Assign</button
            >

            {#if $searchParams.tab === Tab.myWork}
                <Tooltip
                    position={{ left: '10rem' }}
                    text={nonManagerReviewSelected
                        ? 'Please only select resource items that are in Manager Review status.'
                        : null}
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
            <table class="table table-pin-rows">
                {#if $searchParams.tab === Tab.myWork || $searchParams.tab === Tab.toAssign}
                    {@const isMyWorkTab = $searchParams.tab === Tab.myWork}
                    <thead>
                        <tr class="bg-base-200">
                            <th
                                ><input
                                    checked={allRowsSelected}
                                    on:click={onSelectAll}
                                    disabled={allTabContents.length === 0}
                                    type="checkbox"
                                    class="checkbox checkbox-sm"
                                /></th
                            >
                            <SortingTableHeaderCell
                                text="Title"
                                sortKey={SORT_KEYS.title}
                                bind:currentSort={$searchParams.sort}
                            />
                            <th>Resource</th>
                            <th>Language</th>
                            <th>Project</th>
                            {#if isMyWorkTab}
                                <th>Status</th>
                                <th>Last Edit (Days)</th>
                            {/if}
                            <SortingTableHeaderCell
                                text="Deadline (Days)"
                                sortKey={SORT_KEYS.days}
                                bind:currentSort={$searchParams.sort}
                            />
                            <SortingTableHeaderCell
                                text="Word Count"
                                sortKey={SORT_KEYS.wordCount}
                                bind:currentSort={$searchParams.sort}
                            />
                        </tr>
                    </thead>
                    <tbody>
                        {#each sortAssignedData(allTabContents, $searchParams.sort) as resource (resource.id)}
                            {@const href = `/resources/${resource.id}`}
                            <tr class="hover">
                                <TableCell class="w-4"
                                    ><input
                                        bind:checked={resource.rowSelected}
                                        on:change={() => (allTabContents = allTabContents)}
                                        type="checkbox"
                                        class="checkbox checkbox-sm"
                                    /></TableCell
                                >
                                <LinkedTableCell {href}>{resource.englishLabel}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.parentResourceName}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.languageEnglishDisplay}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.projectName ?? ''}</LinkedTableCell>
                                {#if isMyWorkTab}
                                    <LinkedTableCell {href}>{resource.statusDisplayName ?? ''}</LinkedTableCell>
                                    <LinkedTableCell {href}
                                        >{formatSimpleDaysAgo(resource.daysSinceContentUpdated)}</LinkedTableCell
                                    >
                                {/if}
                                <LinkedTableCell
                                    {href}
                                    class={(resource.daysUntilProjectDeadline ?? 0) < 0 ? 'text-error' : ''}
                                    >{resource.daysUntilProjectDeadline ?? ''}</LinkedTableCell
                                >
                                <LinkedTableCell {href}>{resource.wordCount ?? ''}</LinkedTableCell>
                            </tr>
                        {:else}
                            <tr>
                                <td colspan="99" class="text-center">Your work is all done!</td>
                            </tr>
                        {/each}
                    </tbody>
                {:else if $searchParams.tab === Tab.manage}
                    <thead>
                        <tr class="bg-base-200">
                            <th
                                ><input
                                    checked={allRowsSelected}
                                    on:click={onSelectAll}
                                    disabled={allTabContents.length === 0}
                                    type="checkbox"
                                    class="checkbox checkbox-sm"
                                /></th
                            >
                            <SortingTableHeaderCell
                                text="Title"
                                sortKey={SORT_KEYS.title}
                                bind:currentSort={$searchParams.sort}
                            />
                            <th>Resource</th>
                            <th>Language</th>
                            <th>Project</th>
                            <th>Assigned</th>
                            <th>Last Edit (Days)</th>
                            <SortingTableHeaderCell
                                text="Deadline (Days)"
                                sortKey={SORT_KEYS.days}
                                bind:currentSort={$searchParams.sort}
                            />
                            <SortingTableHeaderCell
                                text="Word Count"
                                sortKey={SORT_KEYS.wordCount}
                                bind:currentSort={$searchParams.sort}
                            />
                        </tr>
                    </thead>
                    <tbody>
                        {#each sortAndFilterManageData(allTabContents, $searchParams) as resource (resource.id)}
                            {@const href = `/resources/${resource.id}`}
                            <tr class="hover">
                                <TableCell class="w-4"
                                    ><input
                                        bind:checked={resource.rowSelected}
                                        on:change={() => (allTabContents = allTabContents)}
                                        type="checkbox"
                                        class="checkbox checkbox-sm"
                                    /></TableCell
                                >
                                <LinkedTableCell {href}>{resource.englishLabel}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.parentResourceName}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.languageEnglishDisplay}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.projectName ?? ''}</LinkedTableCell>
                                <LinkedTableCell {href}>{resource.assignedUser.name}</LinkedTableCell>
                                <LinkedTableCell {href}
                                    >{formatSimpleDaysAgo(resource.daysSinceContentUpdated)}</LinkedTableCell
                                >
                                <LinkedTableCell
                                    {href}
                                    class={(resource.daysUntilProjectDeadline ?? 0) < 0 ? 'text-error' : ''}
                                    >{resource.daysUntilProjectDeadline ?? ''}</LinkedTableCell
                                >
                                <LinkedTableCell {href}>{resource.wordCount ?? ''}</LinkedTableCell>
                            </tr>
                        {:else}
                            <tr>
                                <td colspan="99" class="text-center"
                                    >{$searchParams.assignedUserId === 0
                                        ? 'Your work is all done!'
                                        : 'Nothing assigned to this user.'}</td
                                >
                            </tr>
                        {/each}
                    </tbody>
                {/if}
            </table>
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
