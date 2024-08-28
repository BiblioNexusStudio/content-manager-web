<script lang="ts">
    import type { DynamicReport } from '$lib/types/reporting';
    import { convertPascalCaseToHumanReadable } from '$lib/utils/reporting';
    import Chart, { type ChartConfiguration } from 'chart.js/auto';
    import { onDestroy, onMount } from 'svelte';

    export let report: DynamicReport;

    let yColumn = report.columns[1];
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

    let chart: Chart | undefined;

    const chartData: ChartConfiguration = {
        type: 'bar',
        data: {
            labels: xLabels,
            datasets: [
                {
                    label: convertPascalCaseToHumanReadable(yColumn ?? 'unknown'),
                    data: report.results.map((item) => item[1] as number),
                    backgroundColor: ['#0174a3'],
                    borderColor: ['#817556'],
                    borderWidth: 1,
                },
            ],
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
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 6,
                        boxHeight: 6,
                    },
                },
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
            responsive: true,
            maintainAspectRatio: false,
        },
    };

    onMount(async () => {
        chart = new Chart('bar-chart', chartData);
    });

    onDestroy(() => {
        chart?.destroy();
    });
</script>

{#if report.results.length}
    <canvas id="bar-chart" />
{:else}
    <p>No data available.</p>
{/if}
