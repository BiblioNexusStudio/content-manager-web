<script lang="ts">
    import Chart, { type ChartConfiguration } from 'chart.js/auto';
    import { onDestroy, onMount } from 'svelte';
    import type { DailyResourceDownloads } from '$lib/types/reporting';

    export let amountsByMonth: DailyResourceDownloads[];
    const months = amountsByMonth.map((d) =>
        new Date(d.dateValue).toLocaleString('default', { month: 'short', day: 'numeric' })
    );

    let chart: Chart | undefined;

    const updateChart = (totalsData: DailyResourceDownloads[]) => {
        var amounts = totalsData.map((item) => item.amount);
        if (chartData.data.datasets[0]) {
            chartData.data.datasets[0].data = amounts;
        }
    };

    const chartData: ChartConfiguration = {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Number of requests',
                    data: [],
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
        updateChart(amountsByMonth);
        chart = new Chart('dailyDownloadsChart', chartData);
    });

    onDestroy(() => {
        chart?.destroy();
    });
</script>

<div class="flex flex-col">
    <canvas class="!h-full !w-full" id="dailyDownloadsChart" />
</div>
