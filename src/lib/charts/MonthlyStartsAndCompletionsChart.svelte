<script lang="ts">
    import Chart, { type ChartConfiguration } from 'chart.js/auto';
    import { onDestroy, onMount } from 'svelte';
    import type { StatusCountPerMonth } from '$lib/types/reporting';
    import { sortByKey } from '$lib/utils/sorting';

    export let completesByMonth: StatusCountPerMonth[];
    export let startsByMonth: StatusCountPerMonth[];
    const months = [
        ...new Set( //removes duplicates
            sortByKey(completesByMonth.concat(startsByMonth), 'date')!.map((item) => {
                if (item) return new Date(item.date).toLocaleString('default', { month: 'short' });
            })
        ),
    ];

    let chart: Chart | undefined;

    const updateChart = (completesData: StatusCountPerMonth[], startsData: StatusCountPerMonth[]) => {
        let countCompletes = completesData.map((item) => ({
            x: new Date(item.date).toLocaleString('default', { month: 'short' }),
            y: item.statusCount,
        }));
        let countStarts = startsData.map((item) => ({
            x: new Date(item.date).toLocaleString('default', { month: 'short' }),
            y: item.statusCount,
        }));
        if (chartData.data.datasets[0]) {
            // eslint-disable-next-line
            // @ts-ignore
            chartData.data.datasets[0].data = countCompletes;
        }
        if (chartData.data.datasets[1]) {
            // eslint-disable-next-line
            // @ts-ignore
            chartData.data.datasets[1].data = countStarts;
        }
    };

    const chartData: ChartConfiguration = {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    data: [],
                    fill: false,
                    tension: 0.0,
                    borderColor: '#36A2EB',
                    backgroundColor: '#9BD0F5',
                    label: 'Completed',
                },
                {
                    data: [],
                    fill: false,
                    tension: 0.0,
                    borderColor: '#FF6384',
                    backgroundColor: '#FFB1C1',
                    label: 'Started',
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
        updateChart(completesByMonth, startsByMonth);
        chart = new Chart('monthlyAquiferizationsChart', chartData);
    });

    onDestroy(() => {
        chart?.destroy();
    });
</script>

<div class="flex flex-col">
    <canvas class="!h-full !w-full" id="monthlyAquiferizationsChart" />
</div>
