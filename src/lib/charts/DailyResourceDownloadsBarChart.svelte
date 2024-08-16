<script lang="ts">
    import Chart, { type ChartConfiguration } from 'chart.js/auto';
    import { onDestroy, onMount } from 'svelte';
    import type { DailyResourceDownloads } from '$lib/types/reporting';

    export let amountsByDay: DailyResourceDownloads[];
    const days = amountsByDay.map((d) => {
        const utc = new Date(d.date + 'Z').toUTCString();
        return utc.substring(5, 11);
    });

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
            labels: days,
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
        },
    };

    onMount(async () => {
        updateChart(amountsByDay);
        chart = new Chart('dailyDownloadsChart', chartData);
    });

    onDestroy(() => {
        chart?.destroy();
    });
</script>

<canvas id="dailyDownloadsChart" />
