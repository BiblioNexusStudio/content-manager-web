<script lang="ts">
    import Chart, { type ChartConfiguration, type ChartDataset } from 'chart.js/auto';
    import { onDestroy, onMount } from 'svelte';
    import type { ResourcesByLanguage, TotalsByMonth } from '../../routes/+page';
    import { _ as translate } from 'svelte-i18n';

    const defaultSelection = 'default';
    export let resourcesByLanguage: ResourcesByLanguage[];
    export let totalsByMonth: TotalsByMonth[];
    export let languages: string[];
    export let selectedLanguage: string;
    export let selectedResource: string;
    const months = totalsByMonth.map((item) => item.monthAbbreviation);

    let chart: Chart | undefined;

    $: updateTranslatedResourcesChart(selectedLanguage, selectedResource);

    const colors = ['#0174a3', '#00A3E0', '#BABABA', '#344054', '#1D2939'];

    const updateTranslatedResourcesChart = (language: string, resource: string) => {
        let resources = resourcesByLanguage;

        if (language === defaultSelection && resource !== defaultSelection) {
            resources = resources.filter((x) => x.parentResourceName === resource);
        } else if (language !== defaultSelection && resource === defaultSelection) {
            resources = resources.filter((x) => x.language === language);
        } else if (language !== defaultSelection && resource !== defaultSelection) {
            resources = resources.filter((x) => x.language === language && x.parentResourceName === resource);
        }

        let langMonthGroup = resources.reduce(
            (group, resource) => {
                const { language, monthAbbreviation } = resource;
                group[`${language}-${monthAbbreviation}`] = group[`${language}-${monthAbbreviation}`] ?? [];
                group[`${language}-${monthAbbreviation}`].push(resource);

                return group;
            },
            {} as { [monthLanguage: string]: ResourcesByLanguage[] }
        );

        let translatedData = languages.map((x: string) => ({ label: x, data: [] as number[] }));

        for (let langMonth in langMonthGroup) {
            let group = langMonthGroup[langMonth];
            let total = 0;
            for (let i = 0; i < group.length; i++) {
                total += group[i].resourceCount;
            }
            translatedData?.find((x) => x.label === group[0].language)?.data.push(total);
        }

        updateChart(translatedData);
    };

    const updateChart = (data: ChartDataset[]) => {
        for (let i = 0; i < data.length; i++) {
            data[i].backgroundColor = colors[i];
        }

        if (chart !== undefined) {
            chart.data.datasets = data;
            chart.update();
        } else {
            chartData.data.datasets = data;
        }
    };

    const chartData: ChartConfiguration = {
        type: 'bar',
        data: {
            labels: months,
            datasets: [] as { label: string; data: number[] }[],
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
                y: {
                    stacked: true,
                    ticks: {
                        precision: 0,
                    },
                },
            },
            // eslint-disable-next-line
            // @ts-ignore
            barPercentage: 0.5,
        },
    };

    onMount(async () => {
        let canvas = document?.getElementById('areaChartCanvas') as HTMLCanvasElement | undefined;
        let canvasContext = canvas?.getContext('2d');
        if (canvasContext) {
            let gradient = canvasContext.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, '#81755690');
            gradient.addColorStop(1, '#81755600');
            chartData.data.datasets[0].backgroundColor = gradient;
        }

        chart = new Chart('translatedResourcesBarChart', chartData);
    });

    onDestroy(() => {
        chart?.destroy();
    });
</script>

<div class="flex flex-col">
    <div class="mb-6 text-lg font-bold">{$translate('page.dashboard.charts.translatedResources.value')}</div>
    <canvas class="!h-full !w-full" id="translatedResourcesBarChart" />
</div>
