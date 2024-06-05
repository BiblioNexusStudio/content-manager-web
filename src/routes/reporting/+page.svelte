<script lang="ts">
    import type { PageData } from './$types';
    import TotalResourcesAreaChart from '$lib/charts/TotalResourcesAreaChart.svelte';
    import TranslatedResourcesBarChart from '$lib/charts/TranslatedResourcesBarChart.svelte';
    import { _ as translate } from 'svelte-i18n';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import Select from '$lib/components/Select.svelte';
    import { getReportingLinkData } from '$lib/utils/reporting';
    import ReportingLink from '$lib/components/reporting/ReportingLink.svelte';
    import ReportSummaryCard from '$lib/components/reporting/ReportSummaryCard.svelte';
    import MultipleSelect from '$lib/components/MultipleSelect.svelte';

    export let data: PageData;

    $: summaryPromise = data.summary!.promise;
    $: resourceItemsSummaryPromise = data.resourceItemsSummary!.promise;

    const defaultSelection = 'default';

    let selectedLanguages: string[] = [];
    let selectedResource: string = defaultSelection;

    const reportingLinkData = getReportingLinkData();

    let selectedChart = 'TotalResourcesAreaChart';
</script>

{#await Promise.all([summaryPromise, resourceItemsSummaryPromise])}
    <CenteredSpinner />
{:then [summary, resourceItemsSummary]}
    {@const languages = summary.languages.sort()}

    <div class="mx-4 mb-4 mt-4 text-3xl">Reporting</div>
    <div class="mx-4 mb-4 grid grid-cols-3 gap-4">
        <div class="col-span-2 max-h-[614px] rounded border px-4 py-2 shadow-lg">
            <Select
                bind:value={selectedChart}
                class="select select-bordered me-2 mt-2 w-auto"
                options={[
                    { value: 'TotalResourcesAreaChart', label: 'Total Resource Items' },
                    { value: 'TranslatedResourcesBarChart', label: 'Translated Resource Items' },
                ]}
            />
            <div class="mb-6 mt-4 flex flex-row space-x-2">
                <span>
                    <MultipleSelect
                        label={$translate('page.dashboard.dropdowns.allLanguages.value')}
                        bind:values={selectedLanguages}
                        class="w-[15rem]"
                        options={[...languages.map((l) => ({ value: l, label: l }))]}
                    />
                </span>
                <span>
                    <Select
                        bind:value={selectedResource}
                        class="select select-bordered w-auto"
                        options={[
                            { value: 'default', label: $translate('page.dashboard.dropdowns.allResources.value') },
                            ...summary.parentResourceNames.sort().map((l) => ({ value: l, label: l })),
                        ]}
                    />
                </span>
            </div>
            <div class="me-10 ms-5">
                {#if selectedChart === 'TotalResourcesAreaChart'}
                    <TotalResourcesAreaChart
                        {selectedLanguages}
                        {selectedResource}
                        resourcesByLanguage={summary.resourcesByLanguage}
                        totalsByMonth={summary.totalsByMonth}
                        resourcesByType={summary.resourcesByParentResource}
                    />
                {:else if selectedChart === 'TranslatedResourcesBarChart'}
                    <TranslatedResourcesBarChart
                        {selectedLanguages}
                        {selectedResource}
                        resourcesByLanguage={summary.resourcesByLanguage}
                        totalsByMonth={summary.totalsByMonth}
                        {languages}
                    />
                {/if}
            </div>
        </div>

        <div>
            <ReportSummaryCard
                addPlus={true}
                reportTitle="Total Resource Items"
                reportTotal={resourceItemsSummary.totalResources}
                monthTotal={resourceItemsSummary.totalResourcesThisMonth}
            />
            <ReportSummaryCard
                addPlus={true}
                reportTitle="Total Resource Items (non-English)"
                reportTotal={resourceItemsSummary.totalNonEnglishResources}
                monthTotal={resourceItemsSummary.totalNonEnglishResourcesThisMonth}
            />
            <ReportSummaryCard
                addPlus={true}
                reportTitle="Total Resource Items (2+ Languages)"
                reportTotal={resourceItemsSummary.totalResourcesTwoPlusLanguages}
                monthTotal={resourceItemsSummary.totalResourcesTwoPlusLanguagesThisMonth}
            />
            <ReportSummaryCard
                reportTitle="Resource Items being Aquiferized"
                reportTotal={resourceItemsSummary.aquiferizedResources}
                monthTotal={resourceItemsSummary.aquiferizedResourcesThisMonth}
                monthText="Started This Month"
            />
            <ReportSummaryCard
                reportTitle="Resource Items being Translated"
                reportTotal={resourceItemsSummary.totalResourceBeingTranslated}
                monthTotal={resourceItemsSummary.totalResourceBeingTranslatedThisMonth}
                monthText="Started This Month"
            />
        </div>
    </div>

    <div class="mx-4 mb-12 grid grid-cols-3 gap-4">
        {#each reportingLinkData as link (link.reportLink)}
            <ReportingLink
                reportTitle={link.reportTitle}
                reportDescription={link.reportDescription}
                reportLink={link.reportLink}
            />
        {/each}
    </div>
{/await}
