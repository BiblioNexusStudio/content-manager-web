<script lang="ts">
    import Chart, { type ChartConfiguration } from 'chart.js/auto';
    import { onDestroy, tick } from 'svelte';

    export let lines: { label: string; values: { x: string; y: number | null }[] }[];

    async function updateChart(inputLines: typeof lines) {
        if (lineDataIsNullOrEmpty(inputLines)) {
            chart?.destroy();
            chart = null;
        } else {
            if (!chart) {
                await tick();
                chartData.data.labels = [];
                chartData.data.datasets = [];
                if (chartData.options?.animation) {
                    chartData.options.animation.duration = 0;
                }
                chart = new Chart('line-chart', chartData);
            }
            chart.data.labels = inputLines[0]?.values.map(({ x }) => x) ?? [];
            chart.data.datasets = calculateDatasets(inputLines);
            chart.update();
            if (chart.options?.animation) {
                chart.options.animation.duration = 750;
            }
        }
    }

    $: updateChart(lines);

    const colorMap = {
        borderColor: ['#36A2EB', '#FF6384', '#4BC0C0'],
        backgroundColor: ['#9BD0F5', '#FFB1C1', '#A5D8D8'],
    };

    let chart: Chart | null = null;

    const chartData: ChartConfiguration = {
        type: 'line',
        data: {
            labels: [],
            datasets: [],
        },
        options: {
            animation: {
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
            responsive: true,
            maintainAspectRatio: false,
        },
    };

    function lineDataIsNullOrEmpty(inputLines: typeof lines) {
        return inputLines.length === 0 || inputLines.every((line) => line.values.every((value) => value.y === null));
    }

    function calculateDatasets(inputLines: typeof lines) {
        return inputLines.map(({ label, values }, index) => ({
            label,
            data: values.map(({ y }) => y),
            backgroundColor: colorMap.backgroundColor[index % colorMap.backgroundColor.length],
            borderColor: colorMap.borderColor[index % colorMap.borderColor.length],
            fill: false,
            tension: 0,
        }));
    }

    onDestroy(() => {
        chart?.destroy();
    });
</script>

{#if !lineDataIsNullOrEmpty(lines)}
    <canvas id="line-chart" />
{:else}
    <div class="flex h-full w-full flex-row items-center rounded-md border">
        <p class="w-full text-center">No data available.</p>
    </div>
{/if}
