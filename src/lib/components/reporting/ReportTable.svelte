<script lang="ts">
    import { currentListData } from '$lib/stores/reporting';

    $: columns = buildColumns($currentListData[0]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function buildColumns(object: any) {
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
