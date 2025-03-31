<script lang="ts">
    import BarChart from '$lib/components/reporting/BarChart.svelte';
    import type { DynamicReport } from '$lib/types/reporting';
    import { convertPascalCaseToHumanReadable } from '$lib/utils/reporting';

    interface Props {
        report: DynamicReport;
    }

    let { report }: Props = $props();

    function calculateDataPoints(report: DynamicReport) {
        let xType =
            typeof report.results[0]?.[0] === 'number'
                ? ('number' as const)
                : typeof report.results[0]?.[0] === 'string' && !isNaN(Date.parse(report.results[0]?.[0]))
                  ? ('date' as const)
                  : ('string' as const);
        return report.results.map(([x, y]) => {
            if (xType === 'date') {
                const utc = new Date(x + 'Z').toUTCString();
                return { x: utc.substring(5, 11), y: y as number };
            } else {
                return { x: x?.toString() ?? '', y: y as number };
            }
        });
    }
</script>

<BarChart
    dataPoints={calculateDataPoints(report)}
    yLabel={convertPascalCaseToHumanReadable(report.columns[1] ?? 'unknown')}
/>
