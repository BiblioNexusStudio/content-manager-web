<script lang="ts">
    import Table from '$lib/components/Table.svelte';
    import type { DynamicReport, DynamicReportResult } from '$lib/types/reporting';
    import { convertPascalCaseToHumanReadable } from '$lib/utils/reporting';
    import type { searchParameters } from '$lib/utils/sveltekit-search-params';

    interface Props {
        searchParams: ReturnType<typeof searchParameters<{ sort: string }>>;
        report: DynamicReport;
        sortedAndPaginatedResults: DynamicReportResult[];
    }

    let { searchParams, report, sortedAndPaginatedResults }: Props = $props();

    let columnWidths = $derived(calculateColumnWidths(report));

    function calculateColumnWidths(reportData: DynamicReport): number[] {
        return reportData.columns.map((column, index) => {
            const lengths = [column.length, ...reportData.results.map((row) => String(row[index]).length)];
            const maxLength = lengths.reduce((max, current) => (current > max ? current : max), 0);
            return maxLength * 0.75;
        });
    }
</script>

<Table
    bind:searchParams={$searchParams}
    columns={report.columns.map((name, index) => ({
        text: convertPascalCaseToHumanReadable(name),
        width: columnWidths[index],
        itemKey: index,
        sortKey: name,
    }))}
    items={sortedAndPaginatedResults}
    idColumn="index"
    noItemsText="No data available."
/>
