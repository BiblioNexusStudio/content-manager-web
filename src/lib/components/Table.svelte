<script lang="ts" generics="T">
    import { onMount, tick } from 'svelte';
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
    export let noItemsText: string;
    export let searchable = false;
    export let searchText: string | undefined = undefined;
    export let noItemsAfterSearchText = 'No results.';
    export let isLoading = false;

    export let currentPage: number | undefined = undefined;
    export let totalItems: number | undefined = undefined;
    export let itemsPerPage: number | undefined = undefined;

    let scrollingDiv: HTMLDivElement | null = null;
    let isLeftScrollable = false;
    let isRightScrollable = false;
    let isTopScrollable = false;
    let isBottomScrollable = false;
    let internalSort = '';
    let headerRow: HTMLTableRowElement | undefined;
    let headerRowHeight = 0;

    $: itemsPerPage && (currentPage = 1);

    $: totalPages =
        totalItems !== undefined && itemsPerPage !== undefined ? Math.ceil(totalItems / itemsPerPage) : undefined;

    $: allItemsSelected = items && items.length > 0 && items.length === selectedItems.length;
    $: if (items) {
        selectedItems = [];
    }
    $: showingPaginator = !isLoading && currentPage && totalPages;

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

    async function checkScrollable() {
        await tick();
        headerRowHeight = headerRow?.getBoundingClientRect().height ?? 0;
        if (scrollingDiv) {
            isRightScrollable =
                scrollingDiv.scrollWidth > scrollingDiv.clientWidth &&
                scrollingDiv.scrollLeft < scrollingDiv.scrollWidth - scrollingDiv.clientWidth;
            isLeftScrollable = scrollingDiv.scrollLeft > 0;
            isTopScrollable = scrollingDiv.scrollTop > 0;
            isBottomScrollable =
                scrollingDiv.scrollHeight > scrollingDiv.clientHeight &&
                scrollingDiv.scrollTop < scrollingDiv.scrollHeight - scrollingDiv.clientHeight;
        }
    }

    $: scrollingDiv && items && checkScrollable();

    function calculateScrollShadows({
        isRightScrollable,
        isLeftScrollable,
        isTopScrollable,
        isBottomScrollable,
    }: {
        isRightScrollable?: boolean;
        isLeftScrollable?: boolean;
        isTopScrollable?: boolean;
        isBottomScrollable?: boolean;
    }): string {
        const shadows = [];
        if (isRightScrollable) shadows.push('inset -5px 0 5px -5px rgba(0,0,0,0.3)');
        if (isLeftScrollable) shadows.push('inset 5px 0 5px -5px rgba(0,0,0,0.3)');
        if (isTopScrollable) shadows.push('inset 0 5px 5px -5px rgba(0,0,0,0.3)');
        if (isBottomScrollable) shadows.push('inset 0 -5px 5px -5px rgba(0,0,0,0.3)');
        return shadows.join(', ');
    }

    onMount(() => {
        window.addEventListener('resize', checkScrollable);
        scrollingDiv?.addEventListener('scroll', checkScrollable);
        return () => {
            window.removeEventListener('resize', checkScrollable);
            scrollingDiv?.removeEventListener('scroll', checkScrollable);
        };
    });
</script>

<div class="relative flex max-h-full w-full flex-col overflow-x-hidden overflow-y-hidden {$$props.class}">
    <div
        class="pointer-events-none absolute inset-0 z-10"
        style="box-shadow:{calculateScrollShadows({
            isTopScrollable,
        })}; top: {headerRowHeight}px;"
    ></div>
    <div
        class="pointer-events-none absolute inset-0 z-10 rounded-md"
        style="box-shadow:{calculateScrollShadows({
            isLeftScrollable,
            isRightScrollable,
            isBottomScrollable,
        })}"
    ></div>
    <div
        bind:this={scrollingDiv}
        class="overflow-x-auto overflow-y-auto rounded-md border {showingPaginator && 'rounded-b-none border-b-0'}"
    >
        <table class="table table-pin-rows">
            <thead>
                <tr class="bg-base-200" bind:this={headerRow}>
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
            <slot name="customTbody" rowItems={items}>
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
                                itemUrlPrefix &&
                                `${itemUrlPrefix}${idColumn === 'index' ? '' : (item[idColumn] ?? '')}`}
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
                                                >{item[itemKey]?.toLocaleString() ?? ''}</LinkedTableCell
                                            >
                                        {:else if itemKey !== undefined}
                                            <TableCell style={width ? `width: ${width}ch;` : ''}
                                                >{item[itemKey]?.toLocaleString() ?? ''}</TableCell
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
            </slot>
        </table>
    </div>

    {#if showingPaginator}
        <div class="grid w-full grid-cols-3 rounded-b-md border bg-base-200 p-2">
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
