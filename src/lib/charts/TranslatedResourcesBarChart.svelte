<script lang="ts">
    import Chart from 'chart.js/auto';
    import { onMount } from 'svelte';
    import { getLastFiveMonths } from '$lib/charts/ChartUtilities';

    const colors = ['#3c372d', '#585133', '#817556', '#B5AC8B'];
    let tokPisinData = { label: 'Tok Pisin', data: [33, 58, 103, 203, 312], backgroundColor: colors[0] };
    let englishData = { label: 'English', data: [109, 200, 205, 345, 512], backgroundColor: colors[1] };

    const chart = {
        type: 'bar',
        data: {
            labels: getLastFiveMonths(),
            datasets: [tokPisinData, englishData],
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    align: 'end',
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
                    backgroundColor: '#81755620',
                    borderColor: '#817556',
                },
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false,
                    },
                },
            },
            barPercentage: 0.5,
        },
    };

    onMount(async () => {
        let canvasContext = document?.getElementById('areaChartCanvas')?.getContext('2d');
        if (canvasContext != null) {
            let gradient = canvasContext.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, '#81755690');
            gradient.addColorStop(1, '#81755600');
            data.datasets[0].backgroundColor = gradient;
        }

        new Chart('translatedResourcesBarChart', chart);
    });
</script>

<canvas class="!w-full !h-full" id="translatedResourcesBarChart" />
