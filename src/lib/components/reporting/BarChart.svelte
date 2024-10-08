<script lang="ts">
    import Chart, { type ChartConfiguration } from 'chart.js/auto';
    import { onDestroy, onMount } from 'svelte';

    export let yLabel: string;
    export let dataPoints: { x: string; y: number }[];

    const xLabels = dataPoints.map(({ x }) => x);

    let renderedAlready = false;

    // update chart when data changes
    $: if (chart) {
        chart.data.labels = dataPoints.map(({ x }) => x);
        chart.data.datasets[0]!.data = dataPoints.map(({ y }) => y);
        chart.update();
    }

    let chart: Chart | undefined;

    const chartData: ChartConfiguration = {
        type: 'bar',
        data: {
            labels: xLabels,
            datasets: [
                {
                    label: yLabel,
                    data: dataPoints.map(({ y }) => y),
                    backgroundColor: ['#0174a3'],
                    borderColor: ['#817556'],
                    borderWidth: 1,
                },
            ],
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

    onMount(async () => {
        if (!dataPointsAreNullOrEmpty(dataPoints)) {
            chart = new Chart('bar-chart', chartData);
        }
    });

    onDestroy(() => {
        chart?.destroy();
    });
</script>

{#if !dataPointsAreNullOrEmpty(dataPoints)}
    <canvas id="bar-chart" />
{:else}
    <div class="flex h-full w-full flex-row items-center rounded-md border">
        <p class="w-full text-center">No data available.</p>
    </div>
{/if}
