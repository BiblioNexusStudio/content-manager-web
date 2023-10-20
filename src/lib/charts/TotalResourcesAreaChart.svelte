<script lang="ts">
    import Chart, { type ChartConfiguration } from 'chart.js/auto';
    import { onMount } from 'svelte';
    import type { ResourcesByLanguage, ResourcesByType, TotalsByMonth } from '../../routes/+page';

    export let totalsByMonth: TotalsByMonth[];
    export let resourcesByLanguage: ResourcesByLanguage[];
    export let resourcesByType: ResourcesByType[];
    export let defaultSelection = 'default';
    export let selectedLanguage: string;
    export let selectedResource: string;
    export let months: string[];

    let chart: Chart | undefined;

    $: updateTotalResourcesChart(selectedLanguage, selectedResource);

    const updateTotalResourcesChart = (language: string, resource: string) => {
        if (language === defaultSelection && resource !== defaultSelection) {
            let totals = resourcesByType.reduce((resources: TotalsByMonth[], r) => {
                if (r.resourceType === resource) {
                    resources.push({
                        date: r.date,
                        monthAbbreviation: r.monthAbbreviation,
                        resourceCount: r.resourceCount,
                    });
                }
                return resources;
            }, []);

            updateChart(totals);
        } else if (language !== defaultSelection) {
            let languageResources =
                resource === defaultSelection
                    ? resourcesByLanguage.filter((resource) => resource.language === language)
                    : resourcesByLanguage.filter(
                          (item) => item.language === language && item.resourceType === resource
                      );

            let monthGroup = languageResources.reduce(
                (group, resource) => {
                    const { monthAbbreviation } = resource;
                    group[monthAbbreviation] = group[monthAbbreviation] ?? [];
                    group[monthAbbreviation].push(resource);
                    return group;
                },
                {} as { [month: string]: ResourcesByLanguage[] }
            );

            let totals: TotalsByMonth[] = [];
            for (let month in monthGroup) {
                let group = monthGroup[month];
                let total = 0;
                for (let i = 0; i < group.length; i++) {
                    total += group[i].resourceCount;
                }
                totals.push({
                    resourceCount: total,
                    monthAbbreviation: group[0].monthAbbreviation,
                    date: group[0].date,
                });
            }

            updateChart(totals);
        } else {
            updateChart(totalsByMonth);
        }
    };

    const updateChart = (data: TotalsByMonth[]) => {
        let counts = data.map((item) => item.resourceCount);
        if (chart !== undefined) {
            chart.data.datasets[0].data = counts;
            chart.update();
        } else {
            chartData.data.datasets[0].data = counts;
        }
    };

    const chartData: ChartConfiguration = {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    data: [] as number[],
                    fill: true,
                    tension: 0.0,
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
                y: {
                    ticks: {
                        precision: 0,
                    },
                },
            },
        },
    };

    onMount(async () => {
        let canvas = document?.getElementById('totalResourcesAreaChart') as HTMLCanvasElement | undefined;
        let canvasContext = canvas?.getContext('2d');
        if (canvasContext) {
            let gradient = canvasContext.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, '#81755690');
            gradient.addColorStop(1, '#81755600');
            chartData.data.datasets[0].backgroundColor = gradient;
        }

        chart = new Chart('totalResourcesAreaChart', chartData);
    });
</script>

<canvas class="!h-full !w-full" id="totalResourcesAreaChart" />
