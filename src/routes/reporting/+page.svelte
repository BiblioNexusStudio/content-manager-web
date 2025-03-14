<script lang="ts">
    import type { PageData } from './$types';
    import TotalResourcesAreaChart from '$lib/charts/TotalResourcesAreaChart.svelte';
    import TranslatedResourcesBarChart from '$lib/charts/TranslatedResourcesBarChart.svelte';
    import { _ as translate } from 'svelte-i18n';
    import Select from '$lib/components/Select.svelte';
    import { filterToOnlyDynamicReports, reportingUiLinks } from '$lib/utils/reporting';
    import ReportingLink from '$lib/components/reporting/ReportingLink.svelte';
    import ReportSummaryCard from '$lib/components/reporting/ReportSummaryCard.svelte';
    import MultipleSelect from '$lib/components/MultipleSelect.svelte';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let summary = $derived(data.summary);
    let resourceItemsSummary = $derived(data.resourceItemsSummary);
    let reports = $derived(filterToOnlyDynamicReports(data?.reports ?? []));
    let languages = $derived(summary?.languages.sort());

    const defaultSelection = 'default';

    let selectedLanguages: string[] = $state([]);
    let selectedResource: string = $state(defaultSelection);

    let selectedChart = $state('TotalResourcesAreaChart');
</script>

<svelte:head>
    <title>Reporting | Aquifer Admin</title>
</svelte:head>

<div class="overflow-y-auto">
    <div class="mx-4 mb-4 mt-4 text-3xl">Reporting</div>
    <div class="mx-4 mb-4 grid grid-cols-3 gap-4">
        <div class="col-span-2 max-h-[38.375rem] rounded border px-4 py-2 shadow-lg">
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
                        options={[...(languages?.map((l) => ({ value: l, label: l })) ?? [])]}
                    />
                </span>
                <span>
                    <Select
                        bind:value={selectedResource}
                        class="select select-bordered w-auto"
                        options={[
                            { value: 'default', label: $translate('page.dashboard.dropdowns.allResources.value') },
                            ...(summary?.parentResourceNames?.sort().map((l) => ({ value: l, label: l })) ?? []),
                        ]}
                    />
                </span>
            </div>
            <div class="me-10 ms-5">
                {#if selectedChart === 'TotalResourcesAreaChart'}
                    <TotalResourcesAreaChart
                        {selectedLanguages}
                        {selectedResource}
                        resourcesByLanguage={summary?.resourcesByLanguage ?? []}
                        totalsByMonth={summary?.totalsByMonth ?? []}
                        resourcesByType={summary?.resourcesByParentResource ?? []}
                    />
                {:else if selectedChart === 'TranslatedResourcesBarChart'}
                    <TranslatedResourcesBarChart
                        {selectedLanguages}
                        {selectedResource}
                        resourcesByLanguage={summary?.resourcesByLanguage ?? []}
                        totalsByMonth={summary?.totalsByMonth ?? []}
                        languages={languages ?? []}
                    />
                {/if}
            </div>
        </div>

        <div>
            <ReportSummaryCard
                addPlus={true}
                reportTitle="Total Resource Items"
                reportTotal={resourceItemsSummary?.totalResources ?? 0}
                monthTotal={resourceItemsSummary?.totalResourcesThisMonth ?? 0}
            />
            <ReportSummaryCard
                addPlus={true}
                reportTitle="Total Resource Items (non-English)"
                reportTotal={resourceItemsSummary?.totalNonEnglishResources ?? 0}
                monthTotal={resourceItemsSummary?.totalNonEnglishResourcesThisMonth ?? 0}
            />
            <ReportSummaryCard
                addPlus={true}
                reportTitle="Total Resource Items (2+ Languages)"
                reportTotal={resourceItemsSummary?.totalResourcesTwoPlusLanguages ?? 0}
                monthTotal={resourceItemsSummary?.totalResourcesTwoPlusLanguagesThisMonth ?? 0}
            />
            <ReportSummaryCard
                reportTitle="Resource Items being Aquiferized"
                reportTotal={resourceItemsSummary?.aquiferizedResources ?? 0}
                monthTotal={resourceItemsSummary?.aquiferizedResourcesThisMonth ?? 0}
                monthText="Started This Month"
            />
            <ReportSummaryCard
                reportTitle="Resource Items being Translated"
                reportTotal={resourceItemsSummary?.totalResourceBeingTranslated ?? 0}
                monthTotal={resourceItemsSummary?.totalResourceBeingTranslatedThisMonth ?? 0}
                monthText="Started This Month"
            />
        </div>
    </div>

    {#if reports.length}
        <div class="mx-4 mb-4 grid-cols-3">
            <span class="me-2">View Report: </span>
            <Select
                class="select select-bordered max-w-[14rem] flex-grow"
                value=""
                onChange={(slug) => {
                    window.open(`/reporting/reports/${slug}`, '_blank');
                    return false;
                }}
                isNumber={false}
                options={[
                    { value: '', label: 'Select Report' },
                    ...reports.map(({ name, slug }) => ({ value: slug, label: name })),
                ]}
            />
        </div>
    {/if}

    <div class="mx-4 mb-4 grid grid-cols-3 gap-4">
        {#each reportingUiLinks.reports as link (link.reportLink)}
            <ReportingLink
                reportTitle={link.reportTitle}
                reportDescription={link.reportDescription}
                reportLink={link.reportLink}
            />
        {/each}
    </div>
</div>
