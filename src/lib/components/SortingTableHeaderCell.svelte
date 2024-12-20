<script lang="ts">
    interface Props {
        text: string;
        sortKey: string;
        currentSort: string;
        style?: string;
    }

    let { text, sortKey, currentSort = $bindable(), style = '' }: Props = $props();

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

<th {style} class="cursor-pointer select-none" onclick={toggleSort}>
    {text}
    {#if determineCaret(sortKey, currentSort) === ''}
        <span class="text-sm opacity-50">↓</span>
    {:else}
        <span class="text-sm text-gray-700">{determineCaret(sortKey, currentSort)}</span>
    {/if}
</th>
