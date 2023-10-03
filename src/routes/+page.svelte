<script lang="ts">
    import TotalResourcesAreaChart from '$lib/charts/TotalResourcesAreaChart.svelte';
    import TranslatedResourcesBarChart from '$lib/charts/TranslatedResourcesBarChart.svelte';
    import TranslateIcon from '$lib/icons/TranslateIcon.svelte';
    import FileIcon from '$lib/icons/FileIcon.svelte';
    import { _ as translate } from 'svelte-i18n';

    let languageOptions = ['English', 'French', 'Tok Pisin']; // comes from api
    let resourceTypes = ['CBBT-ER', 'Tyndale Bible Dictionary', 'Tyndale Study Notes']; // comes from api
    let totalResources = 268;
    let totalResourcesMultiLanguage = 73;
</script>

<div class="grid grid-cols-2 mx-4">
    <div class="col-span-2 text-3xl mt-4">{$translate('page.dashboard.header.value')}</div>
    <div class="text-lg font-bold mt-4">{$translate('page.dashboard.resourceSnapshot.header.value')}</div>
    <div class="justify-self-end mt-4">
        <span
            ><select class="select select-bordered w-5/12 max-w-xs mr-2">
                <option disabled selected>{$translate('page.dashboard.dropdowns.allLanguages.value')}</option>
                {#each languageOptions as language}
                    <option>{language}</option>
                {/each}
            </select></span
        >
        <span
            ><select class="select select-bordered w-5/12 max-w-xs">
                <option disabled selected>{$translate('page.dashboard.dropdowns.allResources.value')}</option>
                {#each resourceTypes as resource}
                    <option>{resource}</option>
                {/each}
            </select></span
        >
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
        <TotalResourcesAreaChart />
    </div>
    <div class="ml-5 mr-10">
        <TranslatedResourcesBarChart />
    </div>
</div>
