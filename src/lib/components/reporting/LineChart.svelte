<script lang="ts">
    import Chart, { type ChartConfiguration } from 'chart.js/auto';
    import { onDestroy, onMount } from 'svelte';

    export let lines: { label: string; values: { x: string; y: number | null }[] }[];

    const xLabels = lines[0]?.values.map(({ x }) => x) ?? [];

    let renderedAlready = false;

    // update chart when data changes
    $: if (chart) {
        chart.data.labels = lines[0]?.values.map(({ x }) => x) ?? [];
        chart.data.datasets = calculateDatasets(lines);
        chart.update();
    }

    const colorMap = {
        borderColor: ['#36A2EB', '#FF6384', '#4BC0C0'],
        backgroundColor: ['#9BD0F5', '#FFB1C1', '#A5D8D8'],
    };

    let chart: Chart | undefined;

    const chartData: ChartConfiguration = {
        type: 'line',
        data: {
            labels: xLabels,
            datasets: calculateDatasets(lines),
        },
        options: {
            animation: {
                onComplete: function () {
                    if (renderedAlready) {
                        this.options.animation = {
                            duration: 750,
                        };
                    }
                    renderedAlready = true;
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

    onMount(async () => {
        if (!lineDataIsNullOrEmpty(lines)) {
            chart = new Chart('line-chart', chartData);
        }
    });

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
