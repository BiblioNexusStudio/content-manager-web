<script lang="ts">
    import type { PageData } from './$types';
    import TotalResourcesAreaChart from '$lib/charts/TotalResourcesAreaChart.svelte';
    import TranslatedResourcesBarChart from '$lib/charts/TranslatedResourcesBarChart.svelte';
    import TranslateIcon from '$lib/icons/TranslateIcon.svelte';
    import FileIcon from '$lib/icons/FileIcon.svelte';
    import { _ as translate } from 'svelte-i18n';
    import type { ResourcesByType } from './+page';

    export let data: PageData;

    const getLastFiveMonthsTotals = (resourcesByTypes: ResourcesByType[], completedOnly: boolean) => {
        if (completedOnly) {
            resourcesByTypes = resourcesByTypes.filter((record) => record.status === 3);
        }

        let groupedData = resourcesByTypes.reduce((acc, curr) => {
            let key = curr.date;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(curr);
            return acc;
        }, {});

        let sortedData = Object.keys(groupedData).sort((a, b) => {
            return new Date(a) - new Date(b);
        });

        return sortedData
            .map((key) => {
                let sum: number = groupedData[key].reduce(
                    (acc: number, curr: ResourcesByType) => acc + curr.resourceCount,
                    0
                );
                return { month: new Date(key).toLocaleString('default', { month: 'short' }), sum };
            })
            .slice(0, 5);
    };

    let languageOptions = [...new Set(data.summary.resourcesByLanguage.map((item) => item.languageName))].sort();
    let resourceTypes = [...new Set(data.summary.resourcesByType.map((item) => item.resourceType))].sort();
    let totalResources = data.summary.allResourcesCount;
    let totalResourcesMultiLanguage = data.summary.multiLanguageResourcesCount;

    let allData: { month: string; sum: number }[] = getLastFiveMonthsTotals(data.summary.resourcesByType, false);
    //let completedData: { month: string; sum: number }[] = getLastFiveMonthsTotals(data.summary.resourcesByType, true);
</script>

<div class="grid grid-cols-2 mx-4">
    <div class="col-span-2 text-3xl mt-4">{$translate('page.dashboard.header.value')}</div>
    <div class="text-lg font-bold mt-4">{$translate('page.dashboard.resourceSnapshot.header.value')}</div>
    <div class="justify-self-end mt-4">
        <span>
            <select class="select select-bordered w-5/12 max-w-xs mr-2">
                <option selected>{$translate('page.dashboard.dropdowns.allLanguages.value')}</option>
                {#each languageOptions as language}
                    <option>{language}</option>
                {/each}
            </select>
        </span>
        <span>
            <select class="select select-bordered w-5/12 max-w-xs">
                <option selected>{$translate('page.dashboard.dropdowns.allResources.value')}</option>
                {#each resourceTypes as resource}
                    <option>{resource}</option>
                {/each}
            </select>
        </span>
    </div>
    <div class="col-span-2 mt-4 mb-8">
        <div class="stats shadow mr-8">
            <div class="stat">
                <div class="stat-figure ml-4">
                    <FileIcon />
                </div>
                <div class="stat-title">{$translate('page.dashboard.resourceSnapshot.total.value')}</div>
                <div class="stat-value">{totalResources}</div>
                <div class="stat-desc">1+ {$translate('page.dashboard.resourceSnapshot.languages.value')}</div>
            </div>
        </div>
        <div class="stats shadow">
            <div class="stat">
                <div class="stat-figure ml-4">
                    <TranslateIcon />
                </div>
                <div class="stat-title">Total</div>
                <div class="stat-value">{totalResourcesMultiLanguage}</div>
                <div class="stat-desc">2+ Languages</div>
            </div>
        </div>
    </div>
    <div class="text-lg font-bold mb-6">{$translate('page.dashboard.charts.totalResources.value')}</div>
    <div class="text-lg font-bold mb-6">{$translate('page.dashboard.charts.translatedResources.value')}</div>
    <div class="ml-5 mr-10">
        <TotalResourcesAreaChart bind:allData />
    </div>
    <div class="ml-5 mr-10">
        <TranslatedResourcesBarChart />
    </div>
</div>
