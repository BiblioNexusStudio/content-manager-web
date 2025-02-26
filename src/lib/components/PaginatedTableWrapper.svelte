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
        customItemsPerPage = [100, 500, 1000],
        paginatedTable,
    }: Props = $props();

    let totalItems = $derived(sortedContents.length);

    let paginatedContents = $derived.by(() =>
        sortedContents.slice((currentPage - 1) * pageLimit, currentPage * pageLimit)
    );

    $effect(() => {
        if (pageLimit * currentPage > totalItems) {
            currentPage = 1;
        }
    });
</script>

{@render paginatedTable?.(customItemsPerPage, totalItems, paginatedContents)}
