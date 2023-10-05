<script lang="ts">
    import Chart from 'chart.js/auto';
    import { onMount } from 'svelte';

    export let allData: { month: string; sum: number }[] = [];
    //export let completedData: { month: string; sum: number }[] = [];

    console.log(allData.map((item) => item.month));

    const chart = {
        type: 'line',
        data: {
            labels: allData.map((item) => item.month),
            datasets: [
                {
                    data: allData.map((item) => item.sum),
                    fill: true,
                    tension: 0.1,
                },
                // {
                //     data: completedData.map((item) => item.sum),
                //     fill: true,
                //     tension: 0.1,
                // },
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
