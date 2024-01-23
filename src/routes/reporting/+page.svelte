<script lang="ts">
    import type { PageData } from './$types';
    import TotalResourcesAreaChart from '$lib/charts/TotalResourcesAreaChart.svelte';
    import TranslatedResourcesBarChart from '$lib/charts/TranslatedResourcesBarChart.svelte';
    import { _ as translate } from 'svelte-i18n';
    import { unwrapStreamedData } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import Select from '$lib/components/Select.svelte';
    import { getReportingLinkData, getMockReportSummaryCardData } from '$lib/utils/reporting';
    import ReportingLink from '$lib/components/reporting/ReportingLink.svelte';
    import ReportSummaryCard from '$lib/components/reporting/ReportSummaryCard.svelte';

    export let data: PageData;

    $: summaryPromise = unwrapStreamedData(data.summary);

    const defaultSelection = 'default';

    let selectedLanguage: string = defaultSelection;
    let selectedResource: string = defaultSelection;

    const reportingLinkData = getReportingLinkData();
    const mockReportSummaryCardData = getMockReportSummaryCardData();

    let selectedChart = 'TotalResourcesAreaChart';
</script>

{#await summaryPromise}
    <CenteredSpinner />
{:then summary}
    {@const languages = summary.languages.sort()}

    <div class="mx-4 mb-4 mt-4 grid text-2xl font-bold">Reporting</div>
    <div class="mx-4 mb-8 grid grid-cols-3 gap-4">
        <div class="col-span-2 rounded border px-4 py-2 shadow-lg">
            <Select
                bind:value={selectedChart}
                class="select select-bordered me-2 mt-2 w-auto"
                options={[
                    { value: 'TotalResourcesAreaChart', label: 'Total Resources' },
                    { value: 'TranslatedResourcesBarChart', label: 'Translated Resources' },
                ]}
            />
            <div class="mb-6 mt-4">
                <span>
                    <Select
                        bind:value={selectedLanguage}
                        class="select select-bordered me-2 w-auto bg-base-200"
                        options={[
                            { value: 'default', label: $translate('page.dashboard.dropdowns.allLanguages.value') },
                            ...languages.map((l) => ({ value: l, label: l })),
                        ]}
                    />
                </span>
                <span>
                    <Select
                        bind:value={selectedResource}
                        class="select select-bordered w-auto bg-base-200"
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
                        {selectedLanguage}
                        {selectedResource}
                        resourcesByLanguage={summary.resourcesByLanguage}
                        totalsByMonth={summary.totalsByMonth}
                        resourcesByType={summary.resourcesByParentResource}
                    />
                {:else if selectedChart === 'TranslatedResourcesBarChart'}
                    <TranslatedResourcesBarChart
                        {selectedLanguage}
                        {selectedResource}
                        resourcesByLanguage={summary.resourcesByLanguage}
                        totalsByMonth={summary.totalsByMonth}
                        {languages}
                    />
                {/if}
            </div>
        </div>

        <div>
            {#each mockReportSummaryCardData as summaryCard}
                <ReportSummaryCard
                    reportTitle={summaryCard.reportTitle}
                    reportTotal={summaryCard.reportTotal}
                    monthTotal={summaryCard.monthTotal}
                    monthText={summaryCard.monthText}
                />
            {/each}
        </div>
    </div>

    <div class="mx-4 mb-12 grid grid-cols-3 gap-4">
        {#each reportingLinkData as link}
            <ReportingLink
                reportTitle={link.reportTitle}
                reportDescription={link.reportDescription}
                reportLink={link.reportLink}
            />
        {/each}
    </div>
{/await}
