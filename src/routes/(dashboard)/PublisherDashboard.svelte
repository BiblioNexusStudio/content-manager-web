<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import type { Project, ResourceAssignedToSelf, ResourcePendingReview } from './+page';
    import { ResourceContentStatusEnum, UserRole } from '$lib/types/base';
    import { postToApi } from '$lib/utils/http-service';
    import Modal from '$lib/components/Modal.svelte';
    import UserSelector from '../resources/[resourceContentId]/UserSelector.svelte';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import {
        SortName,
        createPublisherDashboardMyWorkSorter,
        createPublisherDashboardProjectsSorter,
        createPublisherDashboardReviewPendingSorter,
    } from './dashboard-table-sorters';
    import Table from '$lib/components/Table.svelte';
    import {
        assignedContentsColumns,
        reviewPendingContentsColumns,
        projectColumns,
    } from './publisher-dashboard-columns';
    import { formatSimpleDaysAgo } from '$lib/utils/date-time';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import TableCell from '$lib/components/TableCell.svelte';
    import ProjectProgressBar from '$lib/components/ProjectProgressBar.svelte';

    enum Tab {
        myWork = 'my-work',
        reviewPending = 'review-pending',
        myProjects = 'my-projects',
    }

    let assignedContents: ResourceAssignedToSelf[] = [];
    let reviewPendingContents: ResourcePendingReview[] = [];
    let assignedProjects: Project[] = [];
    let currentAssignedContents: ResourceAssignedToSelf[] = [];
    let currentReviewPendingContents: ResourcePendingReview[] = [];
    let currentAssignedProjects: Project[] = [];

    const sortAssignedResourceData = createPublisherDashboardMyWorkSorter();
    const sortPendingData = createPublisherDashboardReviewPendingSorter();
    const sortAssignedProjectData = createPublisherDashboardProjectsSorter();

    export let data: PageData;

    let search = '';

    const searchParams = searchParameters(
        {
            sort: ssp.string('-' + SortName.Days),
            tab: ssp.string(Tab.myWork),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    let selectedReviewContentIds: number[] = [];
    let selectedInProgressContentIds: number[] = [];
    let selectedMyWorkTableItems: ResourceAssignedToSelf[] = [];
    let selectedReviewPendingTableItems: ResourcePendingReview[] = [];
    let assignToUserId: number | null = null;
    let isAssignContentModalOpen = false;
    let isConfirmPublishModalOpen = false;
    let errorModalText: string | undefined;
    let isTransacting = false;

    $: $searchParams.tab && resetSelection();

    function resetSelection() {
        selectedMyWorkTableItems = [];
        selectedReviewPendingTableItems = [];
    }

    function shouldAssignAsInProgress(status: ResourceContentStatusEnum | null) {
        return (
            status === ResourceContentStatusEnum.New ||
            status === ResourceContentStatusEnum.TranslationNotStarted ||
            status === ResourceContentStatusEnum.AquiferizeInProgress ||
            status === ResourceContentStatusEnum.TranslationInProgress
        );
    }

    async function assignContent() {
        isTransacting = true;

        selectedInProgressContentIds = [];
        selectedReviewContentIds = [];

        selectedMyWorkTableItems.forEach((item) => {
            if (shouldAssignAsInProgress(item.statusValue)) {
                selectedInProgressContentIds.push(item.id);
            } else {
                selectedReviewContentIds.push(item.id);
            }
        });

        selectedReviewPendingTableItems.forEach((item) => {
            selectedReviewContentIds.push(item.id);
        });

        const inProgessAssignments =
            selectedInProgressContentIds.length > 0
                ? postToApi<null>('/resources/content/assign-editor', {
                      assignedUserId: assignToUserId,
                      contentIds: selectedInProgressContentIds,
                  })
                : Promise.resolve(null);
        const inReviewAssignments =
            selectedReviewContentIds.length > 0
                ? postToApi<null>('/resources/content/assign-review', {
                      assignedUserId: assignToUserId,
                      contentIds: selectedReviewContentIds,
                  })
                : Promise.resolve(null);

        try {
            await Promise.all([inProgessAssignments, inReviewAssignments]);
            isTransacting = false;
            window.location.reload();
        } catch {
            errorModalText = 'Error while assigning content.';
            isTransacting = false;
        }
    }

    async function bulkPublish() {
        isTransacting = true;

        try {
            await postToApi(`/resources/content/publish`, { contentIds: selectedMyWorkTableItems.map((i) => i.id) });
            isTransacting = false;
            window.location.reload();
        } catch {
            errorModalText = 'Error while publishing content.';
            isTransacting = false;
        }
    }

    const allDataPromise = async () => {
        [assignedContents, reviewPendingContents, assignedProjects] = await Promise.all([
            data.publisherDashboard!.assignedResourceContent.promise,
            data.publisherDashboard!.reviewPendingResourceContent.promise,
            data.publisherDashboard!.assignedProjects.promise,
        ]);
    };

    $: nonPublisherReviewSelected = selectedMyWorkTableItems.some(
        (i) =>
            ![
                ResourceContentStatusEnum.AquiferizePublisherReview,
                ResourceContentStatusEnum.TranslationPublisherReview,
            ].includes(i.statusValue)
    );

    let scrollingDiv: HTMLDivElement | undefined;
    $: $searchParams.sort && scrollingDiv && (scrollingDiv.scrollTop = 0);

    function selectTab(tab: Tab) {
        return () => {
            $searchParams.tab = tab;
            $searchParams.sort = tab === Tab.myProjects ? SortName.Days : '-' + SortName.Days;
        };
    }

    const setTabContents = (tab: string, search: string) => {
        if (tab === Tab.myWork) {
            currentAssignedContents = assignedContents.filter((ac) =>
                ac.englishLabel.toLowerCase().includes(search.toLowerCase())
            );
        } else if (tab === Tab.reviewPending) {
            currentReviewPendingContents = reviewPendingContents.filter((rpc) =>
                rpc.englishLabel.toLowerCase().includes(search.toLowerCase())
            );
        } else if (tab === Tab.myProjects) {
            currentAssignedProjects = assignedProjects.filter((ap) =>
                ap.name.toLowerCase().includes(search.toLowerCase())
            );
        }
    };

    $: setTabContents($searchParams.tab, search);
</script>

{#await allDataPromise()}
    <CenteredSpinner />
{:then _}
    <div class="flex max-h-screen flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Publisher Dashboard</h1>
        <div class="flex flex-row items-center pt-4">
            <div role="tablist" class="tabs-bordered tabs w-fit">
                <button
                    on:click={selectTab(Tab.myWork)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.myWork && 'tab-active'}"
                    >My Work ({assignedContents.length})</button
                >
                <button
                    on:click={selectTab(Tab.reviewPending)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.reviewPending && 'tab-active'}"
                    >Review Pending ({reviewPendingContents.length})</button
                >
                <button
                    on:click={selectTab(Tab.myProjects)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.myProjects && 'tab-active'}"
                    >My Projects ({assignedProjects.length})</button
                >
            </div>
        </div>
        {#if $searchParams.tab === Tab.myWork || $searchParams.tab === Tab.reviewPending}
            <div class="mt-4 flex">
                <input
                    class="input input-bordered max-w-xs focus:outline-none"
                    bind:value={search}
                    placeholder="Search"
                />
                <button
                    data-app-insights-event-name="publisher-dashboard-bulk-assign-click"
                    class="btn btn-primary ms-4"
                    on:click={() => (isAssignContentModalOpen = true)}
                    disabled={selectedReviewPendingTableItems.length === 0 && selectedMyWorkTableItems.length === 0}
                    >Assign
                </button>
                {#if $searchParams.tab === Tab.myWork}
                    <Tooltip
                        position={{ left: '7rem' }}
                        text={nonPublisherReviewSelected ? 'Publisher Review status only' : null}
                    >
                        <button
                            data-app-insights-event-name="publisher-dashboard-bulk-publish-click"
                            class="btn btn-primary ms-4"
                            on:click={() => (isConfirmPublishModalOpen = true)}
                            disabled={selectedMyWorkTableItems.length === 0 || nonPublisherReviewSelected}
                            >Publish
                        </button>
                    </Tooltip>
                {/if}
            </div>
        {/if}
        {#if $searchParams.tab === Tab.myProjects}
            <div class="mt-4 flex flex-row">
                <input
                    class="input input-bordered max-w-xs focus:outline-none"
                    bind:value={search}
                    placeholder="Search"
                />
                <a class="btn btn-primary ms-4" href="/projects/new">Create Project</a>
            </div>
        {/if}
        <div class="flex flex-row space-x-4 overflow-y-hidden">
            <div bind:this={scrollingDiv} class="my-4 max-h-full flex-[2] overflow-y-auto">
                {#if $searchParams.tab === Tab.myWork}
                    <Table
                        enableSelectAll={true}
                        columns={assignedContentsColumns}
                        items={sortAssignedResourceData(currentAssignedContents, $searchParams.sort)}
                        itemUrlPrefix="/resources/"
                        bind:searchParams={$searchParams}
                        bind:selectedItems={selectedMyWorkTableItems}
                        noItemsText="Your work is all done!"
                        searchAble={true}
                        bind:searchText={search}
                        let:item
                        let:href
                        let:itemKey
                    >
                        {#if itemKey === 'daysSinceContentUpdated' && item[itemKey] !== null}
                            <LinkedTableCell {href}>{formatSimpleDaysAgo(item[itemKey])}</LinkedTableCell>
                        {:else if href !== undefined && itemKey}
                            <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                        {:else if itemKey}
                            <TableCell>{item[itemKey] ?? ''}</TableCell>
                        {/if}
                    </Table>
                {:else if $searchParams.tab === Tab.reviewPending}
                    <Table
                        enableSelectAll={true}
                        columns={reviewPendingContentsColumns}
                        items={sortPendingData(currentReviewPendingContents, $searchParams.sort)}
                        itemUrlPrefix="/resources/"
                        bind:searchParams={$searchParams}
                        bind:selectedItems={selectedReviewPendingTableItems}
                        noItemsText="No items pending review."
                        searchAble={true}
                        bind:searchText={search}
                        let:item
                        let:href
                        let:itemKey
                    >
                        {#if itemKey === 'daysSinceContentUpdated' && item[itemKey] !== null}
                            <LinkedTableCell {href}>{formatSimpleDaysAgo(item[itemKey])}</LinkedTableCell>
                        {:else if href !== undefined && itemKey}
                            <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                        {:else if itemKey}
                            <TableCell>{item[itemKey] ?? ''}</TableCell>
                        {/if}
                    </Table>
                {:else if $searchParams.tab === Tab.myProjects}
                    <Table
                        enableSelectAll={false}
                        columns={projectColumns}
                        items={sortAssignedProjectData(currentAssignedProjects, $searchParams.sort)}
                        itemUrlPrefix="/projects/"
                        bind:searchParams={$searchParams}
                        noItemsText="No projects assigned to you."
                        searchAble={true}
                        let:item
                        let:href
                        let:itemKey
                        let:columnText
                    >
                        {#if columnText === 'Progress'}
                            <td>
                                <ProjectProgressBar
                                    notStartedCount={item?.counts?.notStarted ?? 0}
                                    inProgressCount={item?.counts?.inProgress ?? 0}
                                    inManagerReviewCount={item?.counts?.inManagerReview ?? 0}
                                    inPublisherReviewCount={item?.counts?.inPublisherReview ?? 0}
                                    completeCount={item?.counts?.completed ?? 0}
                                    showLegend={false}
                                />
                            </td>
                        {:else if href !== undefined && itemKey}
                            <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                        {:else if itemKey}
                            <TableCell>{item[itemKey] ?? ''}</TableCell>
                        {/if}
                    </Table>
                {/if}
            </div>
        </div>
    </div>
{/await}

<Modal
    {isTransacting}
    primaryButtonText={'Assign'}
    primaryButtonOnClick={assignContent}
    primaryButtonDisabled={!assignToUserId}
    bind:open={isAssignContentModalOpen}
    header="Choose a publisher"
>
    <UserSelector
        users={data.users?.filter((u) => u.role === UserRole.Publisher) ?? []}
        defaultLabel="Select User"
        bind:selectedUserId={assignToUserId}
    />
</Modal>

<Modal
    header="Confirm Publish"
    bind:open={isConfirmPublishModalOpen}
    primaryButtonText="Publish"
    primaryButtonOnClick={bulkPublish}
    description="The {selectedMyWorkTableItems.length} selected resource items will be published immediately."
    {isTransacting}
/>

<Modal header="Error" bind:description={errorModalText} isError={true} />
