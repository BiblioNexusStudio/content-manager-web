<script lang="ts">
    import type { PageData } from './$types';
    import { unwrapStreamedData } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import type { ResourceAssignedToSelf } from './+page';
    import SortingTableHeaderCell from '$lib/components/SortingTableHeaderCell.svelte';
    import { createListSorter } from '$lib/utils/sorting';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';

    const SORT_KEYS = {
        days: 'days',
        wordCount: 'word-count',
    };

    const sortData = createListSorter<ResourceAssignedToSelf>({
        [SORT_KEYS.days]: 'daysSinceAssignment',
        [SORT_KEYS.wordCount]: 'wordCount',
    });

    export let data: PageData;

    const searchParams = searchParameters({
        sort: ssp.string(''),
    });

    $: resourceContentsPromise = unwrapStreamedData(data.editorDashboard!.resourceContent);

    let scrollingDiv: HTMLDivElement | undefined;
    $: $searchParams.sort && scrollingDiv && (scrollingDiv.scrollTop = 0);
</script>

{#await resourceContentsPromise}
    <CenteredSpinner />
{:then resourceContents}
    <div class="flex max-h-screen flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Editor Dashboard</h1>
        <h2 class="pt-4 text-lg font-bold">Work Assigned to You ({resourceContents.length})</h2>
        <div bind:this={scrollingDiv} class="my-4 max-h-full flex-grow overflow-y-scroll">
            <table class="table table-pin-rows">
                <thead>
                    <tr class="bg-base-200">
                        <th>Title</th>
                        <th>Resource</th>
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
                    {#if resourceContents.length === 0}
                        <tr>
                            <td colspan="4" class="text-center">Your work is all done!</td>
                        </tr>
                    {:else}
                        {#each sortData(resourceContents, $searchParams.sort) as resource (resource.contentId)}
                            <tr>
                                <LinkedTableCell href={`/resources/${resource.contentId}`}>
                                    {resource.displayName}
                                </LinkedTableCell>
                                <LinkedTableCell href={`/resources/${resource.contentId}`}>
                                    {resource.parentResourceName}
                                </LinkedTableCell>
                                <LinkedTableCell href={`/resources/${resource.contentId}`}>
                                    {resource.status}
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
            </table>
        </div>
    </div>
{/await}
