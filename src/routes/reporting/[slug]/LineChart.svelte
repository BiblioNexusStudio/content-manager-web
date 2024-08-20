<script lang="ts">
    import type { DynamicReport } from '$lib/types/reporting';
    import { convertPascalCaseToHumanReadable } from '$lib/utils/reporting';
    import Chart, { type ChartConfiguration } from 'chart.js/auto';
    import { onDestroy, onMount } from 'svelte';

    export let report: DynamicReport;

    let yColumns = report.columns.slice(1);
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
            return x;
        }
    });

    const colorMap = {
        borderColor: ['#36A2EB', '#FF6384'],
        backgroundColor: ['#9BD0F5', '#FFB1C1'],
    };

    let chart: Chart | undefined;

    const chartData: ChartConfiguration = {
        type: 'line',
        data: {
            labels: xLabels,
            datasets: yColumns.map((column, index) => ({
                label: convertPascalCaseToHumanReadable(column),
                data: report.results.map((item) => item[index + 1] as number),
                backgroundColor: colorMap.backgroundColor[index % colorMap.backgroundColor.length],
                borderColor: colorMap.borderColor[index % colorMap.borderColor.length],
                fill: false,
                tension: 0,
            })),
        },
        options: {
            animation: {
                onComplete: function () {
                    this.options.animation = {
                        duration: 1000,
                    };
                },
                duration: 0,
            },
            plugins: {
                legend: { display: true, position: 'bottom' },
            },
            elements: {
                line: {
                    backgroundColor: '#00A3E020',
                    borderColor: '#00A3E0',
                },
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                    },
                },
                y: {
                    ticks: {
                        precision: 0,
                    },
                },
            },
        },
    };

    onMount(async () => {
        chart = new Chart('line-chart', chartData);
    });

    onDestroy(() => {
        chart?.destroy();
    });
</script>

{#if report.results.length}
    <canvas id="line-chart" />
{:else}
    <p>No data available.</p>
{/if}
