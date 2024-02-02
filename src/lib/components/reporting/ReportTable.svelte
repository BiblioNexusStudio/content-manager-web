<script lang="ts">
    import { currentListData } from '$lib/stores/reporting';
    import type { GenericReportRow } from '$lib/types/reporting';

    $: columns = buildColumns($currentListData[0] || {});
    $: columnWidth = generateColumnWidth(columns);

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

    function generateColumnWidth(columns: string[] | undefined) {
        if (!columns) return 0;
        const width = (100 / columns?.length).toFixed(1) + '%';
        return width.replace(/\.0+/, '');
    }
</script>

<table class="table w-full border">
    <thead class="bg-gray-50">
        {#each columns as column}
            <th class="text-black w-[{columnWidth}]">{formatColumnName(column)}</th>
        {/each}
    </thead>
    <tbody>
        {#each $currentListData as row}
            <tr class="border text-gray-600">
                {#each columns as column}
                    <td class="w-[{columnWidth}]">{row[column]}</td>
                {/each}
            </tr>
        {/each}
    </tbody>
</table>
