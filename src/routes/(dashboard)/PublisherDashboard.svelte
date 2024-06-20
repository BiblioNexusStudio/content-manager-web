<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import type { Project, ResourceAssignedToSelf, ResourcePendingReview } from './+page';
    import { ResourceContentStatusEnum, UserRole } from '$lib/types/base';
    import { postToApi } from '$lib/utils/http-service';
    import Modal from '$lib/components/Modal.svelte';
    import UserSelector from '../resources/[resourceContentId]/UserSelector.svelte';
    import {
        SortName,
        createPublisherDashboardMyWorkSorter,
        createPublisherDashboardProjectsSorter,
        createPublisherDashboardReviewPendingSorter,
    } from './dashboard-table-sorters';
    import Table from '$lib/components/Table.svelte';
    import { assignedContentsColumns, reviewPendingContentsColumns, projectColumns } from './dashboard-table-columns';

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
    let isErrorModalOpen = false;
    let isAssigning = false;

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
        isAssigning = true;

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
            isAssigning = false;
            window.location.reload();
        } catch {
            isErrorModalOpen = true;
            isAssigning = false;
        }
    }

    const allDataPromise = async () => {
        [assignedContents, reviewPendingContents, assignedProjects] = await Promise.all([
            data.publisherDashboard!.assignedResourceContent.promise,
            data.publisherDashboard!.reviewPendingResourceContent.promise,
            data.publisherDashboard!.assignedProjects.promise,
        ]);
    };

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
            <div role="tablist" class="tabs tabs-bordered w-fit">
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
                    />
                {:else if $searchParams.tab === Tab.reviewPending}
                    <Table
                        enableSelectAll={true}
                        columns={reviewPendingContentsColumns}
                        items={sortPendingData(currentReviewPendingContents, $searchParams.sort)}
                        itemUrlPrefix="/resources/"
                        bind:searchParams={$searchParams}
                        bind:selectedItems={selectedReviewPendingTableItems}
                    />
                {:else if $searchParams.tab === Tab.myProjects}
                    <Table
                        enableSelectAll={false}
                        columns={projectColumns}
                        items={sortAssignedProjectData(currentAssignedProjects, $searchParams.sort)}
                        itemUrlPrefix="/projects/"
                        bind:searchParams={$searchParams}
                    />
                {/if}
            </div>
        </div>
    </div>
{/await}

<Modal
    isTransacting={isAssigning}
    primaryButtonText={'Assign'}
    primaryButtonOnClick={assignContent}
    primaryButtonDisabled={!assignToUserId}
    bind:open={isAssignContentModalOpen}
    header={selectedReviewContentIds.length > 0 ? 'Choose a publisher' : 'Choose a user'}
>
    <UserSelector
        users={data.users?.filter((u) => selectedReviewContentIds.length === 0 || u.role === UserRole.Publisher) ?? []}
        defaultLabel="Select User"
        bind:selectedUserId={assignToUserId}
    />
</Modal>

<Modal header="Error" bind:open={isErrorModalOpen} isError={true} description="Error while assigning content." />
