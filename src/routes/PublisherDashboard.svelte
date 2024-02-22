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
        title: 'title',
        language: 'language',
        days: 'days',
        wordCount: 'word-count',
    };

    const sortAssignedData = createListSorter<ResourceAssignedToSelf>({
        [SORT_KEYS.title]: 'englishLabel',
        [SORT_KEYS.language]: 'languageEnglishDisplay',
        [SORT_KEYS.days]: 'daysSinceAssignment',
        [SORT_KEYS.wordCount]: 'wordCount',
    });

    const sortPendingData = createListSorter<ResourcePendingReview>({
        [SORT_KEYS.title]: 'englishLabel',
        [SORT_KEYS.language]: 'languageEnglishDisplay',
        [SORT_KEYS.days]: 'daysSinceStatusChange',
        [SORT_KEYS.wordCount]: 'wordCount',
    });

    export let data: PageData;

    const searchParams = searchParameters({
        sort: ssp.string('-' + SORT_KEYS.days),
        tab: ssp.string(Tab.myWork),
    });

    $: reviewPendingContentsPromise = unwrapStreamedData(data.publisherDashboard!.reviewPendingResourceContent);
    $: assignedContentsPromise = unwrapStreamedData(data.publisherDashboard!.assignedResourceContent);
    $: reportingSummaryPromise = unwrapStreamedData(data.publisherDashboard!.reportingSummary);

    $: allDataPromise = Promise.all([assignedContentsPromise, reviewPendingContentsPromise, reportingSummaryPromise]);

    let scrollingDiv: HTMLDivElement | undefined;
    $: $searchParams.sort && scrollingDiv && (scrollingDiv.scrollTop = 0);
</script>

{#await allDataPromise}
    <CenteredSpinner />
{:then [assignedContents, reviewPendingContents, reportingSummary]}
    <div class="flex max-h-screen flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Publisher Dashboard</h1>
        <div role="tablist" class="tabs tabs-bordered w-fit pt-4">
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
                >Review Pending ({reviewPendingContents.length})</button
            >
        </div>
        <div class="flex flex-row space-x-4 overflow-y-hidden">
            <div bind:this={scrollingDiv} class="my-4 max-h-full flex-[2] overflow-y-scroll">
                <table class="table table-pin-rows">
                    {#if $searchParams.tab === Tab.myWork}
                        <thead>
                            <tr class="bg-base-200">
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
                                {#each sortAssignedData(assignedContents, $searchParams.sort) as resource (resource.id)}
                                    <tr>
                                        <LinkedTableCell href={`/resources/${resource.id}`}>
                                            {resource.englishLabel}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.id}`}>
                                            {resource.parentResourceName}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.id}`}>
                                            {resource.languageEnglishDisplay}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.id}`}>
                                            {resource.status}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.id}`}>
                                            {resource.daysSinceAssignment}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.id}`}>
                                            {resource.wordCount}
                                        </LinkedTableCell>
                                    </tr>
                                {/each}
                            {/if}
                        </tbody>
                    {:else if $searchParams.tab === Tab.reviewPending}
                        <thead>
                            <tr class="bg-base-200">
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
                            {#if reviewPendingContents.length === 0}
                                <tr>
                                    <td colspan="4" class="text-center">No items pending review.</td>
                                </tr>
                            {:else}
                                {#each sortPendingData(reviewPendingContents, $searchParams.sort) as resource (resource.id)}
                                    <tr>
                                        <LinkedTableCell href={`/resources/${resource.id}`}>
                                            {resource.englishLabel}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.id}`}>
                                            {resource.parentResourceName}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.id}`}>
                                            {resource.languageEnglishDisplay}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.id}`}>
                                            {resource.daysSinceStatusChange}
                                        </LinkedTableCell>
                                        <LinkedTableCell href={`/resources/${resource.id}`}>
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
