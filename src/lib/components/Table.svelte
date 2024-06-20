<script lang="ts">
    import SortingTableHeaderCell from '$lib/components/SortingTableHeaderCell.svelte';
    import TableCell from '$lib/components/TableCell.svelte';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import type { column } from '$lib/types/table';
    import ProjectProgressBar from '$lib/components/ProjectProgressBar.svelte';
    import type { ProjectResourceStatusCounts } from '../types/projects';
    import type { searchParameters } from '$lib/utils/sveltekit-search-params';
    import type { SubscribedSearchParams } from '$lib/utils/sveltekit-search-params';

    // eslint-disable-next-line
    export type T = $$Generic<{ id: number; isStarted?: boolean; counts?: ProjectResourceStatusCounts }>;

    export let searchParams: SubscribedSearchParams<ReturnType<typeof searchParameters<{ sort: string; tab: string }>>>;

    export let enableSelect = false;
    export let enableSelectAll = false;
    export let columns: column<T>[] = [];
    export let items: T[] = [];
    export let itemUrlPrefix: string | undefined = undefined;
    export let selectedItems: T[] = [];
    export let noItemsText = 'Your work is all done!';
    export let searchAble = false;
    export let searchText: string | undefined = undefined;
    export let noItemsAfterSearchText = 'No results.';

    $: allItemsSelected = items && items.length > 0 && items.length === selectedItems.length;

    function onSelectAll() {
        if (allItemsSelected) {
            selectedItems = [];
        } else {
            selectedItems = items.map((item) => item);
        }
    }

    function onSelectItem(item: T) {
        const index = selectedItems.indexOf(item);
        if (index === -1) {
            selectedItems = [...selectedItems, item];
        } else {
            selectedItems = selectedItems.filter((_, i) => i !== index);
        }
    }
</script>

<table class="table table-pin-rows">
    <thead>
        <tr class="bg-base-200">
            {#if enableSelectAll}
                <th>
                    <input
                        type="checkbox"
                        class="checkbox checkbox-sm"
                        on:click={onSelectAll}
                        checked={allItemsSelected}
                        disabled={items.length === 0}
                    />
                </th>
            {/if}
            {#each columns as { text, sortKey, itemKey } (itemKey)}
                {#if sortKey}
                    <SortingTableHeaderCell {text} {sortKey} bind:currentSort={searchParams.sort} />
                {:else}
                    <th>{text}</th>
                {/if}
            {/each}
        </tr>
    </thead>
    <tbody>
        {#each items as item (item?.id)}
            {@const href = itemUrlPrefix && `${itemUrlPrefix}${item.id}`}
            <tr class="hover">
                {#if enableSelectAll || enableSelect}
                    <TableCell class="w-4">
                        <input
                            type="checkbox"
                            class="checkbox checkbox-sm"
                            on:change={() => onSelectItem(item)}
                            checked={selectedItems.includes(item)}
                        />
                    </TableCell>
                {/if}
                {#each columns as { itemKey, showProgress } (itemKey)}
                    {#if href !== undefined && itemKey}
                        <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                    {:else if itemKey}
                        <TableCell>{item[itemKey] ?? ''}</TableCell>
                    {:else if showProgress && 'isStarted' in item && item.isStarted}
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
                    {/if}
                {/each}
            </tr>
        {/each}
        {#if items.length === 0}
            <tr>
                <td colspan="99" class="text-center">
                    {#if searchAble && !!searchText}
                        {noItemsAfterSearchText}
                    {:else}
                        {noItemsText}
                    {/if}
                </td>
            </tr>
        {/if}
    </tbody>
</table>
