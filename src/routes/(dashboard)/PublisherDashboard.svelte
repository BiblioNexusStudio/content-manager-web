<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import type { Project, ResourceAssignedToSelf, ResourcePendingReview } from './+page';
    import SortingTableHeaderCell from '$lib/components/SortingTableHeaderCell.svelte';
    import { ResourceContentStatusEnum, UserRole } from '$lib/types/base';
    import { postToApi } from '$lib/utils/http-service';
    import TableCell from '$lib/components/TableCell.svelte';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import Modal from '$lib/components/Modal.svelte';
    import UserSelector from '../resources/[resourceContentId]/UserSelector.svelte';
    import {
        createPublisherDashboardMyWorkSorter,
        createPublisherDashboardProjectsSorter,
        createPublisherDashboardReviewPendingSorter,
    } from './dashboard-table-sorters';
    import { formatSimpleDaysAgo } from '$lib/utils/date-time';
    import ProjectProgressBar from '$lib/components/ProjectProgressBar.svelte';

    enum Tab {
        myWork = 'my-work',
        reviewPending = 'review-pending',
        myProjects = 'my-projects',
    }

    const SORT_KEYS = {
        title: 'title',
        language: 'language',
        days: 'days',
        wordCount: 'word-count',
    };

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
            sort: ssp.string('-' + SORT_KEYS.days),
            tab: ssp.string(Tab.myWork),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    let selectedReviewContentIds: number[] = [];
    let selectedInProgressContentIds: number[] = [];
    let assignToUserId: number | null = null;
    let isAssignContentModalOpen = false;
    let isErrorModalOpen = false;
    let isAssigning = false;

    $: $searchParams.tab && resetSelection();
    $: (search || true) && resetSelection();

    function shouldAssignAsInProgress(status: ResourceContentStatusEnum | null) {
        return (
            status === ResourceContentStatusEnum.New ||
            status === ResourceContentStatusEnum.TranslationNotStarted ||
            status === ResourceContentStatusEnum.AquiferizeInProgress ||
            status === ResourceContentStatusEnum.TranslationInProgress
        );
    }

    function toggleResourceSelection(contentId: number, status: ResourceContentStatusEnum | null = null) {
        return () => {
            if (shouldAssignAsInProgress(status)) {
                const index = selectedInProgressContentIds.indexOf(contentId);
                if (index !== -1) {
                    selectedInProgressContentIds.splice(index, 1);
                    selectedInProgressContentIds = selectedInProgressContentIds;
                } else {
                    selectedInProgressContentIds.push(contentId);
                    selectedInProgressContentIds = selectedInProgressContentIds;
                }
            } else {
                const index = selectedReviewContentIds.indexOf(contentId);
                if (index !== -1) {
                    selectedReviewContentIds.splice(index, 1);
                    selectedReviewContentIds = selectedReviewContentIds;
                } else {
                    selectedReviewContentIds.push(contentId);
                    selectedReviewContentIds = selectedReviewContentIds;
                }
            }
        };
    }

    function resetSelection() {
        selectedReviewContentIds = [];
        selectedInProgressContentIds = [];
    }

    async function assignContent() {
        isAssigning = true;
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
            $searchParams.sort = tab === Tab.myProjects ? SORT_KEYS.days : '-' + SORT_KEYS.days;
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

    function handleSelectAll(tab: string) {
        if (tab === Tab.myWork) {
            const allSelected =
                currentAssignedContents.length ===
                selectedInProgressContentIds.length + selectedReviewContentIds.length;

            if (allSelected) {
                selectedInProgressContentIds = [];
                selectedReviewContentIds = [];
            } else {
                selectedInProgressContentIds = currentAssignedContents
                    .filter((c) => shouldAssignAsInProgress(c.statusValue))
                    .map((c) => c.id);
                selectedReviewContentIds = currentAssignedContents
                    .filter((c) => !shouldAssignAsInProgress(c.statusValue))
                    .map((c) => c.id);
            }
        } else if (tab === Tab.reviewPending) {
            const allSelected = currentReviewPendingContents.length === selectedReviewContentIds.length;

            if (allSelected) {
                selectedReviewContentIds = [];
            } else {
                selectedReviewContentIds = currentReviewPendingContents.map((c) => c.id);
            }
        }
    }

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
                    disabled={selectedReviewContentIds.length === 0 && selectedInProgressContentIds.length === 0}
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
                <table class="table table-pin-rows">
                    {#if $searchParams.tab === Tab.myWork}
                        <thead>
                            <tr class="bg-base-200">
                                <th
                                    ><input
                                        checked={currentAssignedContents.length ===
                                            selectedInProgressContentIds.length + selectedReviewContentIds.length}
                                        on:click={() => handleSelectAll(Tab.myWork)}
                                        disabled={currentAssignedContents.length === 0}
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
                                <SortingTableHeaderCell
                                    text="Language"
                                    sortKey={SORT_KEYS.language}
                                    bind:currentSort={$searchParams.sort}
                                />
                                <th>Status</th>
                                <th>Last Edit (Days)</th>
                                <SortingTableHeaderCell
                                    text="Days Assigned"
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
                            {#each sortAssignedResourceData(currentAssignedContents, $searchParams.sort) as resource (resource.id)}
                                {@const href = `/resources/${resource.id}`}
                                <tr class="hover">
                                    <TableCell class="w-4"
                                        ><input
                                            checked={selectedReviewContentIds.includes(resource.id) ||
                                                selectedInProgressContentIds.includes(resource.id)}
                                            on:change={toggleResourceSelection(resource.id, resource.statusValue)}
                                            type="checkbox"
                                            class="checkbox checkbox-sm"
                                        /></TableCell
                                    >
                                    <LinkedTableCell {href}>{resource.englishLabel}</LinkedTableCell>
                                    <LinkedTableCell {href}>{resource.parentResourceName}</LinkedTableCell>
                                    <LinkedTableCell {href}>{resource.languageEnglishDisplay}</LinkedTableCell>
                                    <LinkedTableCell {href}>{resource.statusDisplayName}</LinkedTableCell>
                                    <LinkedTableCell {href}
                                        >{formatSimpleDaysAgo(resource.daysSinceContentUpdated)}</LinkedTableCell
                                    >
                                    <LinkedTableCell {href}>{resource.daysSinceAssignment}</LinkedTableCell>
                                    <LinkedTableCell {href}>{resource.wordCount ?? ''}</LinkedTableCell>
                                </tr>
                            {:else}
                                <tr>
                                    <td colspan="99" class="text-center">Your work is all done!</td>
                                </tr>
                            {/each}
                        </tbody>
                    {:else if $searchParams.tab === Tab.myProjects}
                        <thead>
                            <tr class="bg-base-200">
                                <th>Title</th>
                                <th>Company</th>
                                <th>Platform</th>
                                <th>Language</th>
                                <SortingTableHeaderCell
                                    text="Days"
                                    sortKey={SORT_KEYS.days}
                                    bind:currentSort={$searchParams.sort}
                                />
                                <th>Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each sortAssignedProjectData(currentAssignedProjects, $searchParams.sort) as project (project.id)}
                                {@const href = `/projects/${project.id}`}
                                <tr class="hover">
                                    <LinkedTableCell {href}>{project.name}</LinkedTableCell>
                                    <LinkedTableCell {href}>{project.company}</LinkedTableCell>
                                    <LinkedTableCell {href}>{project.projectPlatform}</LinkedTableCell>
                                    <LinkedTableCell {href}>{project.language}</LinkedTableCell>
                                    <LinkedTableCell {href} class={project.days ?? 0 < 0 ? 'text-error' : ''}
                                        >{project.days ?? ''}</LinkedTableCell
                                    >
                                    <td>
                                        {#if project.isStarted}
                                            <ProjectProgressBar
                                                notStartedCount={project.counts.notStarted}
                                                inProgressCount={project.counts.inProgress}
                                                inManagerReviewCount={project.counts.inManagerReview}
                                                inPublisherReviewCount={project.counts.inPublisherReview}
                                                completeCount={project.counts.completed}
                                                showLegend={false}
                                            />
                                        {/if}
                                    </td>
                                </tr>
                            {:else}
                                <tr>
                                    <td colspan="99" class="text-center">
                                        {#if !!search}
                                            No results.
                                        {:else}
                                            No projects assigned to you.
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    {:else if $searchParams.tab === Tab.reviewPending}
                        <thead>
                            <tr class="bg-base-200">
                                <th
                                    ><input
                                        checked={currentReviewPendingContents.length ===
                                            selectedReviewContentIds.length}
                                        on:click={() => handleSelectAll(Tab.reviewPending)}
                                        disabled={currentReviewPendingContents.length === 0}
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
                                <SortingTableHeaderCell
                                    text="Language"
                                    sortKey={SORT_KEYS.language}
                                    bind:currentSort={$searchParams.sort}
                                />
                                <th>Last Edit (Days)</th>
                                <SortingTableHeaderCell
                                    text="Days Pending"
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
                            {#each sortPendingData(currentReviewPendingContents, $searchParams.sort) as resource (resource.id)}
                                {@const href = `/resources/${resource.id}`}
                                <tr class="hover">
                                    <TableCell class="w-4"
                                        ><input
                                            checked={selectedReviewContentIds.includes(resource.id) ||
                                                selectedInProgressContentIds.includes(resource.id)}
                                            on:change={toggleResourceSelection(resource.id)}
                                            type="checkbox"
                                            class="checkbox checkbox-sm"
                                        /></TableCell
                                    >
                                    <LinkedTableCell {href}>{resource.englishLabel}</LinkedTableCell>
                                    <LinkedTableCell {href}>{resource.parentResourceName}</LinkedTableCell>
                                    <LinkedTableCell {href}>{resource.languageEnglishDisplay}</LinkedTableCell>
                                    <LinkedTableCell {href}
                                        >{formatSimpleDaysAgo(resource.daysSinceContentUpdated)}</LinkedTableCell
                                    >
                                    <LinkedTableCell {href}>{resource.daysSinceStatusChange}</LinkedTableCell>
                                    <LinkedTableCell {href}>{resource.wordCount ?? ''}</LinkedTableCell>
                                </tr>
                            {:else}
                                <tr>
                                    <td colspan="99" class="text-center">No items pending review.</td>
                                </tr>
                            {/each}
                        </tbody>
                    {/if}
                </table>
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
