<script lang="ts">
    import type { PageData } from './$types';
    import { unwrapStreamedData } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import type { ResourceAssignedToSelf } from './+page';
    import SortingTableHeaderCell from '$lib/components/SortingTableHeaderCell.svelte';
    import { createListSorter } from '$lib/utils/sorting';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import type { ResourcePendingReview } from './proxy+page';
    import TranslatedResourcesBarChart from '$lib/charts/TranslatedResourcesBarChart.svelte';
    import TotalResourcesAreaChart from '$lib/charts/TotalResourcesAreaChart.svelte';

    enum Tab {
        myWork = 'my-work',
        reviewPending = 'review-pending',
    }

    const SORT_KEYS = {
        days: 'days',
        wordCount: 'word-count',
    };

    const sortAssignedData = createListSorter<ResourceAssignedToSelf>({
        [SORT_KEYS.days]: 'daysSinceAssignment',
        [SORT_KEYS.wordCount]: 'wordCount',
    });

    const sortPendingData = createListSorter<ResourcePendingReview>({
        [SORT_KEYS.days]: 'daysSinceStatusChange',
        [SORT_KEYS.wordCount]: 'wordCount',
    });

    export let data: PageData;

    const searchParams = searchParameters({
        sort: ssp.string('-' + SORT_KEYS.days),
        tab: ssp.string(Tab.myWork),
    });

    $: pendingReviewContentsPromise = unwrapStreamedData(data.publisherDashboard!.pendingReviewResourceContent);
    $: assignedContentsPromise = unwrapStreamedData(data.publisherDashboard!.assignedResourceContent);
    $: reportingSummaryPromise = unwrapStreamedData(data.publisherDashboard!.reportingSummary);

    $: allDataPromise = Promise.all([assignedContentsPromise, pendingReviewContentsPromise, reportingSummaryPromise]);

    let scrollingDiv: HTMLDivElement | undefined;
    $: $searchParams.sort && scrollingDiv && (scrollingDiv.scrollTop = 0);
</script>

{#await allDataPromise}
    <CenteredSpinner />
{:then [assignedContents, pendingReviewContents, reportingSummary]}
    <div class="flex max-h-screen flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Publisher Dashboard</h1>
        <div role="tablist" class="tabs-bordered tabs w-fit pt-4">
            <button
                on:click={() => ($searchParams.tab = Tab.myWork)}
                role="tab"
                class="tab {$searchParams.tab === Tab.myWork && 'tab-active'}"
                >My Work ({assignedContents.length})</button
            >
            <button
                on:click={() => ($searchParams.tab = Tab.reviewPending)}
                role="tab"
                class="tab {$searchParams.tab === Tab.reviewPending && 'tab-active'}"
                >Review Pending ({pendingReviewContents.length})</button
            >
        </div>
        <div class="flex flex-row space-x-4 overflow-y-hidden">
            <div bind:this={scrollingDiv} class="my-4 max-h-full flex-[2] overflow-y-scroll">
                <table class="table table-pin-rows">
                    {#if $searchParams.tab === Tab.myWork}
                        <thead>
                            <tr class="bg-base-200">
                                <th>Title</th>
                                <th>Type</th>
                                <SortingTableHeaderCell
                                    text="Days"
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
                            {#if assignedContents.length === 0}
                                <tr>
                                    <td colspan="4" class="text-center">Your work is all done!</td>
                                </tr>
                            {:else}
                                {#each sortAssignedData(assignedContents, $searchParams.sort) as resource}
                                    <tr>
                                        <LinkedTableCell href={`/resources/${resource.contentId}`}>
                                            {resource.displayName}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.contentId}`}>
                                            {resource.parentResourceName}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.contentId}`}>
                                            {resource.daysSinceAssignment}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.contentId}`}>
                                            {resource.wordCount}
                                        </LinkedTableCell>
                                    </tr>
                                {/each}
                            {/if}
                        </tbody>
                    {:else if $searchParams.tab === Tab.reviewPending}
                        <thead>
                            <tr class="bg-base-200">
                                <th>Title</th>
                                <th>Type</th>
                                <th>Assigned</th>
                                <SortingTableHeaderCell
                                    text="Days"
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
                            {#if assignedContents.length === 0}
                                <tr>
                                    <td colspan="4" class="text-center">No items pending review.</td>
                                </tr>
                            {:else}
                                {#each sortPendingData(pendingReviewContents, $searchParams.sort) as resource}
                                    <tr>
                                        <LinkedTableCell href={`/resources/${resource.contentId}`}>
                                            {resource.displayName}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.contentId}`}>
                                            {resource.parentResourceName}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.contentId}`}>
                                            {resource.assignedUserName ?? ''}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.contentId}`}>
                                            {resource.daysSinceStatusChange}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.contentId}`}>
                                            {resource.wordCount}
                                        </LinkedTableCell>
                                    </tr>
                                {/each}
                            {/if}
                        </tbody>
                    {/if}
                </table>
            </div>
            <div class="my-4 flex flex-1 flex-col space-y-2 overflow-y-scroll">
                <div class="rounded-lg border border-secondary p-2">
                    <TotalResourcesAreaChart
                        selectedLanguage="default"
                        selectedResource="default"
                        resourcesByLanguage={reportingSummary.resourcesByLanguage}
                        totalsByMonth={reportingSummary.totalsByMonth}
                        resourcesByType={reportingSummary.resourcesByParentResource}
                    />
                </div>
                <div class="rounded-lg border border-secondary p-2">
                    <TranslatedResourcesBarChart
                        selectedLanguage="default"
                        selectedResource="default"
                        resourcesByLanguage={reportingSummary.resourcesByLanguage}
                        totalsByMonth={reportingSummary.totalsByMonth}
                        languages={reportingSummary.languages}
                    />
                </div>
            </div>
        </div>
    </div>
{/await}
