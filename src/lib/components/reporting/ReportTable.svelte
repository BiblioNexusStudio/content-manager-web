<script lang="ts">
    import { currentListData } from '$lib/stores/reporting';
    import type { GenericReportRow } from '$lib/types/reporting';

    $: columns = buildColumns($currentListData[0] || {});

    function buildColumns(object: GenericReportRow) {
        return Object.keys(object).map((key) => {
            return key;
        });
    }

    function formatColumnName(columnName: string) {
        return columnName
            .split(/(?=[A-Z])/)
            .join(' ')
            .replace(/^\w/, (c) => c.toUpperCase());
    }
</script>

<div class="grid grid-cols-{columns.length} w-full rounded-md border border-b-0">
    {#each columns as column}
        <div class="border-b bg-gray-50 px-4 py-3 text-xs font-bold">{formatColumnName(column)}</div>
    {/each}
    {#each $currentListData as row}
        {#each columns as column}
            <div class="border-b px-4 py-3 text-sm text-gray-600">{row[column]}</div>
        {/each}
    {/each}
</div>
