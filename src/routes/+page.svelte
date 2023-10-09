<script lang="ts">
    import type { PageData } from './$types';
    import TotalResourcesAreaChart from '$lib/charts/TotalResourcesAreaChart.svelte';
    import TranslatedResourcesBarChart from '$lib/charts/TranslatedResourcesBarChart.svelte';
    import TranslateIcon from '$lib/icons/TranslateIcon.svelte';
    import FileIcon from '$lib/icons/FileIcon.svelte';
    import { _ as translate } from 'svelte-i18n';

    export let data: PageData;

    let languages = data.summary.languages.sort();
    let resourceTypes = data.summary.resourceTypes.sort();
    let totalResources = data.summary.allResourcesCount;
    let totalResourcesMultiLanguage = data.summary.multiLanguageResourcesCount;

    const months = data.summary.totalsByMonth.map((item) => item.monthAbbreviation);
    const defaultSelection = 'default';

    let selectedLanguage: string = defaultSelection;
    let selectedResource: string = defaultSelection;
</script>

<div class="grid grid-cols-2 mx-4">
    <div class="col-span-2 text-3xl mt-4">{$translate('page.dashboard.header.value')}</div>
    <div class="col-span-2 text-lg font-bold mt-4">{$translate('page.dashboard.resourceSnapshot.header.value')}</div>
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
    <div class="col-span-2 mt-4 mb-6">
        <span>
            <select bind:value={selectedLanguage} class="select select-bordered w-1/6 max-w-xs mr-2">
                <option value="default" selected>{$translate('page.dashboard.dropdowns.allLanguages.value')}</option>
                {#each languages as language}
                    <option>{language}</option>
                {/each}
            </select>
        </span>
        <span>
            <select bind:value={selectedResource} class="select select-bordered w-1/6 max-w-xs">
                <option value="default" selected>{$translate('page.dashboard.dropdowns.allResources.value')}</option>
                {#each resourceTypes as resource}
                    <option>{resource}</option>
                {/each}
            </select>
        </span>
    </div>
    <div class="text-lg font-bold mb-6">{$translate('page.dashboard.charts.totalResources.value')}</div>
    <div class="text-lg font-bold mb-6">{$translate('page.dashboard.charts.translatedResources.value')}</div>
    <div class="ml-5 mr-10">
        <TotalResourcesAreaChart
            bind:selectedLanguage
            bind:selectedResource
            {defaultSelection}
            {months}
            resourcesByLanguage={data.summary.resourcesByLanguage}
            totalsByMonth={data.summary.totalsByMonth}
            resourcesByType={data.summary.resourcesByType}
        />
    </div>
    <div class="ml-5 mr-10">
        <TranslatedResourcesBarChart
            bind:selectedLanguage
            bind:selectedResource
            {defaultSelection}
            {months}
            resourcesByLanguage={data.summary.resourcesByLanguage}
            {languages}
        />
    </div>
</div>
