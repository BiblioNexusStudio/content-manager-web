<script lang="ts">
    import SortingTableHeaderCell from '$lib/components/SortingTableHeaderCell.svelte';
    import TableCell from '$lib/components/TableCell.svelte';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import type { column, selectableItem } from '$lib/types/table';

    export let enableSelectAll = false;
    export let columns: column[] = [];
    export let items: selectableItem[] = [];
    export let hrefForItem: string | undefined = undefined;

    $: allItemsSelected = items.every((item) => item.isSelected);

    function onSelectAll() {
        if (allItemsSelected) {
            items = items.map((item) => {
                return { ...item, isSelected: false };
            });
        } else {
            items = items.map((item) => {
                return { ...item, isSelected: true };
            });
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
            {#each columns as { text, sortKey, currentSort, itemKey } (itemKey)}
                {#if sortKey && currentSort}
                    <SortingTableHeaderCell {text} {sortKey} {currentSort} />
                {:else}
                    <th>{text}</th>
                {/if}
            {/each}
        </tr>
    </thead>
    <tbody>
        {#each items as item (item?.id)}
            {@const href = hrefForItem && `${hrefForItem}${item.id}`}
            <tr class="hover">
                {#if enableSelectAll}
                    <TableCell class="w-4">
                        <input
                            type="checkbox"
                            class="checkbox checkbox-sm"
                            on:change={() => {
                                const index = items.indexOf(item);
                                items[index] = { ...items[index], isSelected: !items[index]?.isSelected };
                                items = items;
                            }}
                            bind:checked={item.isSelected}
                        />
                    </TableCell>
                {/if}
                {#each columns as { itemKey } (itemKey)}
                    {#if href !== undefined}
                        <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
                    {:else}
                        <TableCell>{item[itemKey] ?? ''}</TableCell>
                    {/if}
                {/each}
            </tr>
        {/each}
    </tbody>
</table>
