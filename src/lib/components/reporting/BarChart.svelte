<script lang="ts">
    import Chart, { type ChartConfiguration } from 'chart.js/auto';
    import { onDestroy, tick } from 'svelte';

    export let yLabel: string;
    export let dataPoints: { x: string; y: number }[];

    async function updateChart(inputYLabel: string, inputDataPoints: typeof dataPoints) {
        if (dataPointsAreNullOrEmpty(inputDataPoints)) {
            chart?.destroy();
            chart = null;
        } else {
            if (!chart) {
                await tick();
                chartData.data.labels = [];
                chartData.data.datasets[0]!.label = undefined;
                chartData.data.datasets[0]!.data = [];
                if (chartData.options?.animation) {
                    chartData.options.animation.duration = 0;
                }
                chart = new Chart('bar-chart', chartData);
            }
            chart.data.labels = inputDataPoints.map(({ x }) => x);
            chart.data.datasets[0]!.label = inputYLabel;
            chart.data.datasets[0]!.data = inputDataPoints.map(({ y }) => y);
            chart.update();
            if (chart.options?.animation) {
                chart.options.animation.duration = 750;
            }
        }
    }

    $: updateChart(yLabel, dataPoints);

    let chart: Chart | null = null;

    const chartData: ChartConfiguration = {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: undefined,
                    data: [],
                    backgroundColor: ['#0174a3'],
                    borderColor: ['#817556'],
                    borderWidth: 1,
                },
            ],
        },
        options: {
            animation: {
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

    function dataPointsAreNullOrEmpty(inputDataPoints: typeof dataPoints) {
        return inputDataPoints.length === 0 || inputDataPoints.every((point) => point.y === null || point.y === 0);
    }

    onDestroy(() => {
        chart?.destroy();
    });
</script>

{#if !dataPointsAreNullOrEmpty(dataPoints)}
    <canvas id="bar-chart"></canvas>
{:else}
    <div class="flex h-full w-full flex-row items-center rounded-md border">
        <p class="w-full text-center">No data available.</p>
    </div>
{/if}
