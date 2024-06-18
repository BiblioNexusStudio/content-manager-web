<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import SortingTableHeaderCell from '$lib/components/SortingTableHeaderCell.svelte';
    import { SortName, createEditorDashboardSorter } from './dashboard-table-sorters';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import { formatSimpleDaysAgo } from '$lib/utils/date-time';

    const sortData = createEditorDashboardSorter();

    export let data: PageData;

    const searchParams = searchParameters(
        {
            sort: ssp.string(`-${SortName.Days}`),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    $: resourceContentsPromise = data.editorDashboard!.resourceContent.promise;

    let scrollingDiv: HTMLDivElement | undefined;
    $: $searchParams.sort && scrollingDiv && (scrollingDiv.scrollTop = 0);
</script>

{#await resourceContentsPromise}
    <CenteredSpinner />
{:then resourceContents}
    <div class="flex max-h-screen flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Editor Dashboard</h1>
        <h2 class="pt-4 text-lg font-bold">Work Assigned to You ({resourceContents.length})</h2>
        <div bind:this={scrollingDiv} class="my-4 max-h-full flex-grow overflow-y-auto">
            <table class="table table-pin-rows">
                <thead>
                    <tr class="bg-base-200">
                        <th>Title</th>
                        <th>Resource</th>
                        <th>Last Edit (Days)</th>
                        <SortingTableHeaderCell
                            text="Days Assigned"
                            sortKey={SortName.Days}
                            bind:currentSort={$searchParams.sort}
                        />
                        <SortingTableHeaderCell
                            text="Word Count"
                            sortKey={SortName.WordCount}
                            bind:currentSort={$searchParams.sort}
                        />
                    </tr>
                </thead>
                <tbody>
                    {#each sortData(resourceContents, $searchParams.sort) as resource (resource.id)}
                        {@const href = `/resources/${resource.id}`}
                        <tr class="hover">
                            <LinkedTableCell {href}>{resource.englishLabel}</LinkedTableCell>
                            <LinkedTableCell {href}>{resource.parentResourceName}</LinkedTableCell>
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
            </table>
        </div>
    </div>
{/await}
