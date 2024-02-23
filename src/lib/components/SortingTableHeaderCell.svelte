<script lang="ts">
    export let text: string;
    export let sortKey: string;
    export let currentSort: string;

    const determineCaret = (sortKey: string, currentSort: string): string => {
        if (currentSort === sortKey) return '↑';
        if (currentSort === '-' + sortKey) return '↓';
        return '';
    };

    function toggleSort() {
        const isAscending = currentSort === sortKey;
        currentSort = isAscending ? '-' + sortKey : sortKey;
    }
</script>

<th class="cursor-pointer select-none" on:click={toggleSort}>
    {text}
    {#if determineCaret(sortKey, currentSort) === ''}
        <span class="text-sm opacity-50">↓</span>
    {:else}
        <span class="text-sm text-gray-700">{determineCaret(sortKey, currentSort)}</span>
    {/if}
</th>
