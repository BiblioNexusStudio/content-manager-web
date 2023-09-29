<script lang="ts">
    import Chart from 'chart.js/auto';
    import { onMount } from 'svelte';

    onMount(async () => {
        new Chart('areaChartCanvas', { type: 'line', data: data });
    });

    const getLastFiveMonths = () => {
        const months: string[] = [];
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 4; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            months.push(monthNames[monthIndex]);
        }

        return months;
    };

    const data = {
        labels: getLastFiveMonths(),
        datasets: [
            {
                data: [13, 84, 162, 203, 268],
                fill: true,
                tension: 0.1,
            },
        ],
    };
</script>

<canvas id="areaChartCanvas" />
