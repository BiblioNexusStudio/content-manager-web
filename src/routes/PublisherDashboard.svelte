<script lang="ts">
    import type { PageData } from './$types';
    import TotalResourcesAreaChart from '$lib/charts/TotalResourcesAreaChart.svelte';
    import TranslatedResourcesBarChart from '$lib/charts/TranslatedResourcesBarChart.svelte';
    import TranslateIcon from '$lib/icons/TranslateIcon.svelte';
    import FileIcon from '$lib/icons/FileIcon.svelte';
    import { _ as translate } from 'svelte-i18n';
    import { unwrapStreamedData } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';

    export let data: PageData;

    $: summaryPromise = unwrapStreamedData(data.summary!);

    const defaultSelection = 'default';

    let selectedLanguage: string = defaultSelection;
    let selectedResource: string = defaultSelection;
</script>

{#await summaryPromise}
    <CenteredSpinner />
{:then summary}
    {@const months = summary.totalsByMonth.map((item) => item.monthAbbreviation)}
    {@const languages = summary.languages.sort()}

    <div class="mx-4 grid grid-cols-2">
        <div class="col-span-2 mt-4 text-3xl">{$translate('page.dashboard.header.value')}</div>
        <div class="col-span-2 mt-4 text-lg font-bold">
            {$translate('page.dashboard.resourceSnapshot.header.value')}
        </div>
        <div class="col-span-2 mb-8 mt-4">
            <div class="stats me-8 shadow">
                <div class="stat">
                    <div class="stat-figure ms-4">
                        <FileIcon />
                    </div>
                    <div class="stat-title">{$translate('page.dashboard.resourceSnapshot.total.value')}</div>
                    <div class="stat-value">{summary.allResourcesCount}</div>
                    <div class="stat-desc">1+ {$translate('page.dashboard.resourceSnapshot.languages.value')}</div>
                </div>
            </div>
            <div class="stats shadow">
                <div class="stat">
                    <div class="stat-figure ms-4">
                        <TranslateIcon />
                    </div>
                    <div class="stat-title">Total</div>
                    <div class="stat-value">{summary.multiLanguageResourcesCount}</div>
                    <div class="stat-desc">2+ Languages</div>
                </div>
            </div>
        </div>
        <div class="col-span-2 mb-6 mt-4">
            <span>
                <select bind:value={selectedLanguage} class="select select-bordered me-2 w-1/6 max-w-xs bg-base-200">
                    <option value="default" selected>{$translate('page.dashboard.dropdowns.allLanguages.value')}</option
                    >
                    {#each languages as language}
                        <option>{language}</option>
                    {/each}
                </select>
            </span>
            <span>
                <select bind:value={selectedResource} class="select select-bordered w-1/6 max-w-xs bg-base-200">
                    <option value="default" selected>{$translate('page.dashboard.dropdowns.allResources.value')}</option
                    >
                    {#each summary.parentResourceNames.sort() as resource}
                        <option>{resource}</option>
                    {/each}
                </select>
            </span>
        </div>
        <div class="mb-6 text-lg font-bold">{$translate('page.dashboard.charts.totalResources.value')}</div>
        <div class="mb-6 text-lg font-bold">{$translate('page.dashboard.charts.translatedResources.value')}</div>
        <div class="me-10 ms-5">
            <TotalResourcesAreaChart
                bind:selectedLanguage
                bind:selectedResource
                {defaultSelection}
                {months}
                resourcesByLanguage={summary.resourcesByLanguage}
                totalsByMonth={summary.totalsByMonth}
                resourcesByType={summary.resourcesByParentResource}
            />
        </div>
        <div class="me-10 ms-5">
            <TranslatedResourcesBarChart
                bind:selectedLanguage
                bind:selectedResource
                {defaultSelection}
                {months}
                resourcesByLanguage={summary.resourcesByLanguage}
                {languages}
            />
        </div>
    </div>
{/await}
