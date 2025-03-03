<script lang="ts" generics="T extends object">
    import type { Snippet } from 'svelte';

    interface Props {
        pageLimit: number;
        sortedContents: T[];
        currentPage: number;
        customItemsPerPage?: number[];
        paginatedTable?: Snippet<[number[], number, T[]]>;
    }

    let {
        pageLimit = $bindable(100),
        sortedContents,
        currentPage = $bindable(),
        customItemsPerPage = [100, 500, 1000, Infinity],
        paginatedTable,
    }: Props = $props();

    let totalItems = $derived(sortedContents.length);

    let paginatedContents = $derived.by(() =>
        sortedContents.slice((currentPage - 1) * pageLimit, currentPage * pageLimit)
    );
</script>

{@render paginatedTable?.(customItemsPerPage, totalItems, paginatedContents)}
