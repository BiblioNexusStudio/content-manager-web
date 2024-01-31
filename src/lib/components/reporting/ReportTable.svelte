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

<table class="table w-full border">
    <thead class="bg-gray-50">
        {#each columns as column}
            <th class="text-black">{formatColumnName(column)}</th>
        {/each}
    </thead>
    <tbody>
        {#each $currentListData as row}
            <tr class="border text-gray-600">
                {#each columns as column}
                    <td>{row[column]}</td>
                {/each}
            </tr>
        {/each}
    </tbody>
</table>
