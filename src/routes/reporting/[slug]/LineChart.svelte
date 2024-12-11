<script lang="ts">
    import LineChart from '$lib/components/reporting/LineChart.svelte';
    import type { DynamicReport } from '$lib/types/reporting';
    import { convertPascalCaseToHumanReadable } from '$lib/utils/reporting';

    export let report: DynamicReport;

    function calculateLines(report: DynamicReport) {
        let xType =
            typeof report.results[0]?.[0] === 'number'
                ? ('number' as const)
                : typeof report.results[0]?.[0] === 'string' && !isNaN(Date.parse(report.results[0]?.[0]))
                  ? ('date' as const)
                  : ('string' as const);

        const xLabels = report.results.map(([x, _y]) => {
            if (xType === 'date') {
                const utc = new Date(x + 'Z').toUTCString();
                return utc.substring(5, 11);
            } else {
                return x?.toString() ?? '';
            }
        });

        return report.columns.slice(1).map((column, outerIndex) => ({
            label: convertPascalCaseToHumanReadable(column),
            values: report.results.map((item, innerIndex) => ({
                x: xLabels[innerIndex] ?? '',
                y: item[outerIndex + 1] as number,
            })),
        }));
    }
</script>

<LineChart lines={calculateLines(report)} />
