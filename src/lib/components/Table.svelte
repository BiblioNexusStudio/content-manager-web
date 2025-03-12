<script lang="ts" generics="T extends object">
    import { onMount, tick } from 'svelte';
    import SortingTableHeaderCell from '$lib/components/SortingTableHeaderCell.svelte';
    import TableCell from '$lib/components/TableCell.svelte';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import type { column } from '$lib/types/table';
    import type { searchParameters } from '$lib/utils/sveltekit-search-params';
    import type { SubscribedSearchParams } from '$lib/utils/sveltekit-search-params';
    import CenteredSpinner from './CenteredSpinner.svelte';
    import { _ as translate } from 'svelte-i18n';
    import type { Snippet } from 'svelte';

    interface Props {
        searchParams?: SubscribedSearchParams<ReturnType<typeof searchParameters<{ sort: string }>>> | undefined;
        enableSelect?: boolean;
        enableSelectAll?: boolean;
        columns: column<T>[];
        items: T[];
        idColumn: keyof T | 'index';
        itemUrlPrefix?: string;
        selectedItems?: T[];
        noItemsText: string;
        searchable?: boolean;
        searchText?: string;
        noItemsAfterSearchText?: string;
        isLoading?: boolean;
        currentPage?: number;
        totalItems?: number;
        itemsPerPage?: number;
        customItemsPerPage?: number[];
        class?: string;
        tableCells?: Snippet<[T, string, keyof T, string]>;
        customTbody?: Snippet<[T[], T[] | undefined, (item: T) => void]>;
        children?: Snippet;
    }

    let {
        searchParams = $bindable(),
        enableSelect = false,
        enableSelectAll = false,
        columns = [],
        items = [],
        idColumn = 'index',
        itemUrlPrefix = undefined,
        selectedItems = $bindable(),
        noItemsText,
        searchable = false,
        searchText = $bindable(),
        noItemsAfterSearchText = undefined,
        isLoading = false,
        currentPage = $bindable(),
        totalItems = undefined,
        itemsPerPage = $bindable(),
        customItemsPerPage = [10, 50, 100],
        class: className = '',
        tableCells,
        customTbody,
        children,
    }: Props = $props();

    let scrollingDiv: HTMLDivElement | null = $state(null);
    let isLeftScrollable = $state(false);
    let isRightScrollable = $state(false);
    let isTopScrollable = $state(false);
    let isBottomScrollable = $state(false);
    let internalSort = $state('');
    let headerRow: HTMLTableRowElement | undefined = $state(undefined);
    let headerRowHeight = $state(0);

    let totalPages = $derived(
        totalItems !== undefined && itemsPerPage !== undefined ? Math.ceil(totalItems / itemsPerPage) : undefined
    );

    let allItemsSelected = $derived(items && items.length > 0 && items.length === selectedItems?.length);

    $effect(() => {
        if (items) {
            selectedItems = [];
        }
    });

    let showingPaginator = $derived(!isLoading && currentPage && totalPages);

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
        const index = selectedItems?.indexOf(item);
        if (index === -1) {
            selectedItems = [...(selectedItems ?? []), item];
        } else {
            selectedItems = selectedItems?.filter((_, i) => i !== index) ?? [];
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

    $effect(() => {
        scrollingDiv && items && checkScrollable();
    });

    $effect.pre(() => {
        if (itemsPerPage === Infinity || (showingPaginator && currentPage && totalPages && currentPage > totalPages)) {
            currentPage = 1;
        }
    });

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

<div class="relative flex max-h-full w-full flex-col overflow-x-hidden overflow-y-hidden {className}">
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
        <table class="table-pin-rows table">
            <thead>
                <tr class="bg-base-200" bind:this={headerRow}>
                    {#if enableSelectAll}
                        <th>
                            <input
                                type="checkbox"
                                class="checkbox checkbox-sm"
                                onclick={onSelectAll}
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
            {#if customTbody}
                {@render customTbody?.(items, selectedItems, onSelectItem)}
            {:else}
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
                                            onchange={() => onSelectItem(item)}
                                            checked={selectedItems?.includes(item)}
                                        />
                                    </TableCell>
                                {/if}
                                {#each columns as { itemKey, text: columnText, width } (itemKey)}
                                    {#if tableCells}
                                        {@render tableCells?.(item, href ?? '', itemKey!, columnText ?? '')}
                                    {:else if children}
                                        {@render children?.()}
                                    {:else if href !== undefined && itemKey}
                                        <LinkedTableCell style={width ? `width: ${width}ch;` : ''} {href}
                                            >{item[itemKey]?.toLocaleString() ?? ''}</LinkedTableCell
                                        >
                                    {:else if itemKey !== undefined}
                                        <TableCell style={width ? `width: ${width}ch;` : ''}
                                            >{item[itemKey]?.toLocaleString() ?? ''}</TableCell
                                        >
                                    {/if}
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
            {/if}
        </table>
    </div>

    {#if showingPaginator || itemsPerPage === Infinity}
        <div class="bg-base-200 grid w-full grid-cols-3 rounded-b-md border p-2">
            <button
                class="btn btn-outline self-center justify-self-start"
                class:btn-disabled={currentPage === 1}
                onclick={() => currentPage && currentPage--}
                >{$translate('page.resources.table.navigation.previous.value')}</button
            >
            <div class="grid place-self-center">
                <div class="mx-auto mb-2 flex">
                    {$translate('page.resources.table.navigation.pageNumber.value', {
                        values: { currentPage, totalPages: `${totalPages === 0 ? 1 : totalPages}` },
                    })}
                </div>
                <select bind:value={itemsPerPage} class="select select-bordered select-xs">
                    {#each customItemsPerPage as count, i (i)}
                        {#if count === Infinity}
                            <option value={count} selected={i === 0}>
                                {$translate('page.resources.table.navigation.all.value')}
                            </option>
                        {:else}
                            <option value={count} selected={i === 0}>
                                {`${count} ${$translate('page.resources.table.navigation.perPage.value')}`}
                            </option>
                        {/if}
                    {/each}
                </select>
            </div>
            <button
                class="btn btn-outline self-center justify-self-end"
                class:btn-disabled={currentPage === totalPages || itemsPerPage === Infinity}
                onclick={() => currentPage && currentPage++}
                >{$translate('page.resources.table.navigation.next.value')}</button
            >
        </div>
    {/if}
</div>
