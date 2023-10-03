<script lang="ts">
    import Chart from 'chart.js/auto';
    import { onMount } from 'svelte';
    import { getLastFiveMonths } from '$lib/charts/ChartUtilities';

    const chart = {
        type: 'line',
        data: {
            labels: getLastFiveMonths(),
            datasets: [
                {
                    data: [13, 84, 162, 203, 268],
                    fill: true,
                    tension: 0.1,
                },
            ],
        },
        options: {
            plugins: {
                legend: { display: false },
            },
            elements: {
                line: {
                    backgroundColor: '#81755620',
                    borderColor: '#817556',
                },
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                    },
                },
            },
        },
    };

    onMount(async () => {
        let canvasContext = document?.getElementById('totalResourcesAreaChart')?.getContext('2d');
        if (canvasContext != undefined) {
            let gradient = canvasContext.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, '#81755690');
            gradient.addColorStop(1, '#81755600');
            chart.data.datasets[0].backgroundColor = gradient;
        }

        new Chart('totalResourcesAreaChart', chart);
    });
</script>

<canvas class="!w-full !h-full" id="totalResourcesAreaChart" />
