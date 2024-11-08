<script lang="ts">
    import type { PageData } from './$types';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import type { Project, ResourceAssignedToSelf, ResourcePendingReview, NotApplicableContent } from './+page';
    import { ResourceContentStatusEnum, UserRole } from '$lib/types/base';
    import { postToApi } from '$lib/utils/http-service';
    import Select from '$lib/components/Select.svelte';
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
        communityPendingContentsColumns,
        notApplicableContentsColumns,
    } from './publisher-dashboard-columns';
    import { formatSimpleDaysAgo } from '$lib/utils/date-time';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import TableCell from '$lib/components/TableCell.svelte';
    import ProjectProgressBar from '$lib/components/ProjectProgressBar.svelte';
    import { filterBoolean } from '$lib/utils/array';
    import CenteredSpinnerFullScreen from '$lib/components/CenteredSpinnerFullScreen.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';
    import { ResourceContentVersionReviewLevel } from '$lib/types/resources';

    enum Tab {
        myWork = 'my-work',
        reviewPending = 'review-pending',
        myProjects = 'my-projects',
        community = 'community',
        notApplicable = 'not-applicable',
    }

    let assignedContents: ResourceAssignedToSelf[] = [];
    let reviewPendingContents: ResourcePendingReview[] = [];
    let assignedProjects: Project[] = [];
    let communityPendingContents: ResourcePendingReview[] = [];
    let notApplicableContent: NotApplicableContent[] = [];
    let currentAssignedContents: ResourceAssignedToSelf[] = [];
    let currentReviewPendingContents: ResourcePendingReview[] = [];
    let currentAssignedProjects: Project[] = [];
    let currentCommunityPendingContents: ResourcePendingReview[] = [];

    const sortAssignedResourceData = createPublisherDashboardMyWorkSorter();
    const sortPendingData = createPublisherDashboardReviewPendingSorter();
    const sortAssignedProjectData = createPublisherDashboardProjectsSorter();

    export let data: PageData;

    let search = '';

    const searchParams = searchParameters(
        {
            sort: ssp.string('-' + SortName.Days),
            tab: ssp.string(Tab.myWork),
            project: ssp.string(''),
            status: ssp.string(''),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    let selectedMyWorkTableItems: ResourceAssignedToSelf[] = [];
    let selectedReviewPendingTableItems: ResourcePendingReview[] = [];
    let selectedCommunityPendingTableItems: ResourcePendingReview[] = [];
    let assignToUserId: number | null = null;
    let isAssignContentModalOpen = false;
    let isConfirmPublishModalOpen = false;
    let errorModalText: string | undefined;
    let isTransacting = false;

    $: $searchParams.tab && resetSelection();

    function resetSelection() {
        selectedMyWorkTableItems = [];
        selectedReviewPendingTableItems = [];
        selectedCommunityPendingTableItems = [];
    }

    function shouldAssignAsEditorReview(status: ResourceContentStatusEnum | null) {
        return (
            status === ResourceContentStatusEnum.New ||
            status === ResourceContentStatusEnum.TranslationAwaitingAiDraft ||
            status === ResourceContentStatusEnum.TranslationAiDraftComplete ||
            status === ResourceContentStatusEnum.AquiferizeEditorReview ||
            status === ResourceContentStatusEnum.TranslationEditorReview
        );
    }

    async function assignContent() {
        let selectedReviewContentIds: number[] = [];
        let selectedEditorReviewContentIds: number[] = [];

        isTransacting = true;

        selectedMyWorkTableItems.forEach((item) => {
            if (shouldAssignAsEditorReview(item.statusValue)) {
                selectedEditorReviewContentIds.push(item.id);
            } else {
                selectedReviewContentIds.push(item.id);
            }
        });

        selectedReviewPendingTableItems.forEach((item) => {
            selectedReviewContentIds.push(item.id);
        });

        selectedCommunityPendingTableItems.forEach((item) => {
            selectedReviewContentIds.push(item.id);
        });

        const inProgessAssignments =
            selectedEditorReviewContentIds.length > 0
                ? postToApi<null>('/resources/content/send-for-editor-review', {
                      assignedUserId: assignToUserId,
                      contentIds: selectedEditorReviewContentIds,
                  })
                : Promise.resolve(null);
        const inReviewAssignments =
            selectedReviewContentIds.length > 0
                ? postToApi<null>('/resources/content/send-for-publisher-review', {
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

    function projectNamesForContents(contents: ResourceAssignedToSelf[] | ResourcePendingReview[]) {
        return Array.from(new Set(filterBoolean(contents.map((c) => c.projectName)))).sort();
    }

    function statusesForContents(contents: ResourceAssignedToSelf[]) {
        return Array.from(new Set(filterBoolean(contents.map((c) => c.statusDisplayName)))).sort();
    }

    const allDataPromise = async () => {
        [assignedContents, reviewPendingContents, assignedProjects, notApplicableContent] = await Promise.all([
            data.publisherDashboard!.assignedResourceContent.promise,
            data.publisherDashboard!.reviewPendingResourceContent.promise,
            data.publisherDashboard!.assignedProjects.promise,
            data.publisherDashboard!.notApplicableContent.promise,
        ]);

        communityPendingContents = reviewPendingContents.filter((item) => {
            return item.reviewLevel === ResourceContentVersionReviewLevel.community;
        });

        reviewPendingContents = reviewPendingContents.filter((item) => {
            return item.reviewLevel !== ResourceContentVersionReviewLevel.community;
        });
    };

    $: nonPublisherReviewSelected = selectedMyWorkTableItems.some(
        (i) =>
            ![
                ResourceContentStatusEnum.AquiferizePublisherReview,
                ResourceContentStatusEnum.TranslationPublisherReview,
            ].includes(i.statusValue)
    );

    // eslint-disable-next-line
    let table: Table<any> | null;
    $: $searchParams.sort && table?.resetScroll();
    $: clearStaleSearchParams($searchParams.tab, assignedContents, reviewPendingContents);

    // Handle situation where project/status is set in the searchParams but is no longer valid. E.g. saved bookmark
    // or forced refresh after assign that removed all of them.
    function clearStaleSearchParams(
        tab: string,
        assignedContents: ResourceAssignedToSelf[],
        reviewPendingContents: ResourcePendingReview[]
    ) {
        if (!assignedContents.length || !reviewPendingContents.length) {
            return;
        }

        const projectNames =
            tab === Tab.myWork
                ? projectNamesForContents(assignedContents)
                : tab === Tab.reviewPending
                ? projectNamesForContents(reviewPendingContents)
                : [];
        if (
            $searchParams.project &&
            ((tab !== Tab.myWork && tab !== Tab.reviewPending) || !projectNames.includes($searchParams.project))
        ) {
            $searchParams.project = '';
        }
        if (
            $searchParams.status &&
            (tab !== Tab.myWork || !statusesForContents(assignedContents).includes($searchParams.status))
        ) {
            $searchParams.status = '';
        }
    }

    function selectTab(tab: Tab) {
        return () => {
            $searchParams.tab = tab;
            $searchParams.sort = tab === Tab.myProjects ? SortName.Days : '-' + SortName.Days;
        };
    }

    const setTabContents = (tab: string, search: string, status: string, project: string) => {
        if (tab === Tab.myWork) {
            currentAssignedContents = assignedContents.filter(
                (ac) =>
                    ac.englishLabel.toLowerCase().includes(search.toLowerCase()) &&
                    (!status || ac.statusDisplayName === status) &&
                    (!project || ac.projectName === project)
            );
        } else if (tab === Tab.reviewPending) {
            currentReviewPendingContents = reviewPendingContents.filter(
                (rpc) =>
                    rpc.englishLabel.toLowerCase().includes(search.toLowerCase()) &&
                    (!project || rpc.projectName === project)
            );
        } else if (tab === Tab.myProjects) {
            currentAssignedProjects = assignedProjects.filter((ap) =>
                ap.name.toLowerCase().includes(search.toLowerCase())
            );
        } else if (tab === Tab.community) {
            currentCommunityPendingContents = communityPendingContents.filter((crpc) =>
                crpc.englishLabel.toLowerCase().includes(search.toLowerCase())
            );
        }
    };

    $: setTabContents($searchParams.tab, search, $searchParams.status, $searchParams.project);
</script>

{#await allDataPromise()}
    <CenteredSpinnerFullScreen />
{:then _}
    <div class="flex flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Dashboard</h1>
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
                <button
                    on:click={selectTab(Tab.community)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.community && 'tab-active'}"
                >
                    Community Pending ({communityPendingContents.length})
                </button>
                <button
                    on:click={selectTab(Tab.notApplicable)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.notApplicable && 'tab-active'}"
                >
                    Not Applicable ({notApplicableContent.length})
                </button>
            </div>
        </div>
        {#if $searchParams.tab === Tab.myWork || $searchParams.tab === Tab.reviewPending || $searchParams.tab === Tab.community}
            <div class="mt-4 flex space-x-4">
                <input
                    class="input input-bordered max-w-xs focus:outline-none"
                    bind:value={search}
                    placeholder="Search"
                />
                {#if $searchParams.tab === Tab.myWork}
                    <Select
                        class="select select-bordered max-w-[14rem] flex-grow"
                        bind:value={$searchParams.status}
                        onChange={resetSelection}
                        options={[
                            { value: '', label: 'Status' },
                            ...statusesForContents(assignedContents).map((p) => ({ value: p, label: p })),
                        ]}
                    />
                {/if}
                {#if $searchParams.tab !== Tab.community}
                    <Select
                        class="select select-bordered max-w-[14rem] flex-grow"
                        bind:value={$searchParams.project}
                        onChange={resetSelection}
                        options={[
                            { value: '', label: 'Project' },
                            ...projectNamesForContents(
                                $searchParams.tab === Tab.myWork ? assignedContents : reviewPendingContents
                            ).map((p) => ({ value: p, label: p })),
                        ]}
                    />
                {/if}
                <button
                    data-app-insights-event-name="publisher-dashboard-bulk-assign-click"
                    class="btn btn-primary"
                    on:click={() => (isAssignContentModalOpen = true)}
                    disabled={selectedReviewPendingTableItems.length === 0 &&
                        selectedMyWorkTableItems.length === 0 &&
                        selectedCommunityPendingTableItems.length === 0}
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
            {#if $searchParams.tab === Tab.myWork}
                <Table
                    bind:this={table}
                    class="my-4"
                    enableSelectAll={true}
                    columns={assignedContentsColumns}
                    items={sortAssignedResourceData(currentAssignedContents, $searchParams.sort)}
                    idColumn="id"
                    itemUrlPrefix="/resources/"
                    bind:searchParams={$searchParams}
                    bind:selectedItems={selectedMyWorkTableItems}
                    noItemsText="Your work is all done!"
                    searchable={true}
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
                    bind:this={table}
                    class="my-4"
                    enableSelectAll={true}
                    columns={reviewPendingContentsColumns}
                    items={sortPendingData(currentReviewPendingContents, $searchParams.sort)}
                    idColumn="id"
                    itemUrlPrefix="/resources/"
                    bind:searchParams={$searchParams}
                    bind:selectedItems={selectedReviewPendingTableItems}
                    noItemsText="No items pending review."
                    searchable={true}
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
                    bind:this={table}
                    class="my-4"
                    enableSelectAll={false}
                    columns={projectColumns}
                    items={sortAssignedProjectData(currentAssignedProjects, $searchParams.sort)}
                    idColumn="id"
                    itemUrlPrefix="/projects/"
                    bind:searchParams={$searchParams}
                    noItemsText="No projects assigned to you."
                    searchable={true}
                    let:item
                    let:href
                    let:itemKey
                    let:columnText
                >
                    {#if columnText === 'Progress'}
                        <td>
                            <ProjectProgressBar
                                notStartedCount={item?.counts?.notStarted ?? 0}
                                editorReviewCount={item?.counts?.editorReview ?? 0}
                                inCompanyReviewCount={item?.counts?.inCompanyReview ?? 0}
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
            {:else if $searchParams.tab === Tab.community}
                <Table
                    bind:this={table}
                    class="my-4"
                    enableSelectAll={true}
                    columns={communityPendingContentsColumns}
                    items={sortPendingData(currentCommunityPendingContents, $searchParams.sort)}
                    idColumn="id"
                    itemUrlPrefix="/resources/"
                    bind:searchParams={$searchParams}
                    bind:selectedItems={selectedCommunityPendingTableItems}
                    noItemsText="No items pending review."
                    searchable={true}
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
            {:else if $searchParams.tab === Tab.notApplicable}
                <Table
                    bind:this={table}
                    class="my-4"
                    enableSelectAll={false}
                    columns={notApplicableContentsColumns}
                    items={notApplicableContent}
                    idColumn="id"
                    itemUrlPrefix="/resources/"
                    noItemsText="No items pending review."
                />
            {/if}
        </div>
    </div>
{:catch error}
    <ErrorMessage uncastError={error} />
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
