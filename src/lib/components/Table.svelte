<script lang="ts" generics="T">
    import SortingTableHeaderCell from '$lib/components/SortingTableHeaderCell.svelte';
    import TableCell from '$lib/components/TableCell.svelte';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import type { column } from '$lib/types/table';
    import type { searchParameters } from '$lib/utils/sveltekit-search-params';
    import type { SubscribedSearchParams } from '$lib/utils/sveltekit-search-params';
    import CenteredSpinner from './CenteredSpinner.svelte';
    import { _ as translate } from 'svelte-i18n';

    export let searchParams: SubscribedSearchParams<ReturnType<typeof searchParameters<{ sort: string }>>> | undefined =
        undefined;

    export let enableSelect = false;
    export let enableSelectAll = false;
    export let columns: column<T>[] = [];
    export let items: T[] = [];
    export let idColumn: keyof T | 'index';
    export let itemUrlPrefix: string | undefined = undefined;
    export let selectedItems: T[] = [];
    export let noItemsText = 'Your work is all done!';
    export let searchable = false;
    export let searchText: string | undefined = undefined;
    export let noItemsAfterSearchText = 'No results.';
    export let isLoading = false;

    export let currentPage: number | undefined = undefined;
    export let totalItems: number | undefined = undefined;
    export let itemsPerPage: number | undefined = undefined;

    let scrollingDiv: HTMLDivElement | null = null;
    let internalSort = '';

    $: itemsPerPage && (currentPage = 1);

    $: totalPages =
        totalItems !== undefined && itemsPerPage !== undefined ? Math.ceil(totalItems / itemsPerPage) : undefined;

    $: allItemsSelected = items && items.length > 0 && items.length === selectedItems.length;
    $: if (items) {
        selectedItems = [];
    }

    export function resetScroll() {
        if (scrollingDiv) {
            scrollingDiv.scrollTop = 0;
        }
    }

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

<div class="flex max-h-full flex-1 flex-col overflow-y-hidden {$$props.class}">
    <div bind:this={scrollingDiv} class="overflow-y-scroll">
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
                    {#each columns as { text, sortKey, itemKey, width } (itemKey)}
                        {#if sortKey}
                            {#if searchParams}
                                <SortingTableHeaderCell
                                    {text}
                                    {sortKey}
                                    bind:currentSort={searchParams.sort}
                                    style={width ? `width: ${width}ch;` : ''}
                                />
                            {:else}
                                <SortingTableHeaderCell
                                    {text}
                                    {sortKey}
                                    bind:currentSort={internalSort}
                                    style={width ? `width: ${width}ch;` : ''}
                                />
                            {/if}
                        {:else}
                            <th style={width ? `width: ${width}ch;` : ''}>{text}</th>
                        {/if}
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#if isLoading}
                    <tr>
                        <td colspan="99">
                            <CenteredSpinner />
                        </td>
                    </tr>
                {:else}
                    {#each items as item, index (idColumn === 'index' ? index : item[idColumn])}
                        {@const href =
                            itemUrlPrefix && `${itemUrlPrefix}${idColumn === 'index' ? '' : item[idColumn] ?? ''}`}
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
                            {#each columns as { itemKey, text, width } (itemKey)}
                                <slot {item} {href} {itemKey} columnText={text}>
                                    {#if href !== undefined && itemKey}
                                        <LinkedTableCell style={width ? `width: ${width}ch;` : ''} {href}
                                            >{item[itemKey] ?? ''}</LinkedTableCell
                                        >
                                    {:else if itemKey !== undefined}
                                        <TableCell style={width ? `width: ${width}ch;` : ''}
                                            >{item[itemKey] ?? ''}</TableCell
                                        >
                                    {/if}
                                </slot>
                            {/each}
                        </tr>
                    {/each}
                    {#if items.length === 0}
                        <tr>
                            <td colspan="99" class="text-center">
                                {#if searchable && !!searchText}
                                    {noItemsAfterSearchText}
                                {:else}
                                    {noItemsText}
                                {/if}
                            </td>
                        </tr>
                    {/if}
                {/if}
            </tbody>
        </table>
    </div>

    {#if !isLoading && currentPage && totalPages}
        <div class="grid w-full grid-cols-3 bg-base-200 p-2">
            <button
                class="btn btn-outline self-center justify-self-start"
                class:btn-disabled={currentPage === 1}
                on:click={() => currentPage && currentPage--}
                >{$translate('page.resources.table.navigation.previous.value')}</button
            >
            <div class="grid place-self-center">
                <div class="mb-2">
                    {$translate('page.resources.table.navigation.pageNumber.value', {
                        values: { currentPage, totalPages },
                    })}
                </div>
                <select bind:value={itemsPerPage} class="select select-bordered select-ghost select-xs">
                    {#each [10, 50, 100] as count, i (i)}
                        <option value={count} selected={i === 0}>
                            {`${count} ${$translate('page.resources.table.navigation.perPage.value')}`}
                        </option>
                    {/each}
                </select>
            </div>
            <button
                class="btn btn-outline self-center justify-self-end"
                class:btn-disabled={currentPage === totalPages}
                on:click={() => currentPage && currentPage++}
                >{$translate('page.resources.table.navigation.next.value')}</button
            >
        </div>
    {/if}
</div>
