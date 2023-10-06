<script lang="ts">
    import Chart from 'chart.js/auto';
    import { onMount } from 'svelte';
    import type { TotalsByMonth } from '../../routes/+page';

    export let allData: TotalsByMonth[] = [];

    let chart: Chart | undefined;
    $: updateChart(allData);
    const updateChart = (data: TotalsByMonth[]) => {
        console.log('called updateChart');
        console.log(chart);
        if (chart !== undefined) {
            chart.data.datasets[0].data = allData.map((item) => item.resourceCount);
            chart.update();
        }
    };

    const chartData = {
        type: 'line',
        data: {
            labels: allData.map((item) => item.monthAbbreviation),
            datasets: [
                {
                    data: allData.map((item) => item.resourceCount),
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
            chartData.data.datasets[0].backgroundColor = gradient;
        }

        chart = new Chart('totalResourcesAreaChart', chartData);
    });
</script>

<canvas class="!w-full !h-full" id="totalResourcesAreaChart" />
