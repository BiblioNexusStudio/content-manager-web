<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { DynamicReportType, type DynamicReportResult, type DynamicReport } from '$lib/types/reporting';
    import BarChart from './BarChart.svelte';
    import { searchParameters } from '$lib/utils/sveltekit-search-params';
    import { _searchParamsConfig, _defaultTableRowsPerPage } from './+page';
    import DatePicker from '$lib/components/DatePicker.svelte';
    import { Icon } from 'svelte-awesome';
    import refresh from 'svelte-awesome/icons/refresh';
    import LineChart from './LineChart.svelte';
    import ReportTable from './ReportTable.svelte';
    import { createListSorter } from '$lib/utils/sorting';
    import ReportTablePagination from './ReportTablePagination.svelte';
    import Select from '$lib/components/Select.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';
    import { companiesToIgnore } from '$lib/types/base';

    export let data: PageData;

    const searchParams = searchParameters(_searchParamsConfig, {
        runLoadAgainWhenParamsChange: ['startDate', 'endDate', 'languageId', 'parentResourceId', 'companyId'],
    });

    let startDate = $searchParams.startDate;
    let endDate = $searchParams.endDate;
    let languageId = $searchParams.languageId;
    let parentResourceId = $searchParams.parentResourceId;
    let companyId = $searchParams.companyId;

    let reportData: DynamicReport | undefined;
    let results: DynamicReportResult[] = [];

    function refetch() {
        if (
            startDate !== $searchParams.startDate ||
            endDate !== $searchParams.endDate ||
            languageId !== $searchParams.languageId ||
            parentResourceId !== $searchParams.parentResourceId ||
            companyId !== $searchParams.companyId
        ) {
            $searchParams.paginationStart = 0;
            $searchParams.paginationEnd = _defaultTableRowsPerPage;
        }

        $searchParams.startDate = startDate;
        $searchParams.endDate = endDate;
        $searchParams.languageId = languageId;
        $searchParams.parentResourceId = parentResourceId;
        $searchParams.companyId = companyId;
    }

    $: reportPromise = data.reportData!.promise;
    $: companiesPromise = data.companies.promise;

    $: initializeFromReport(reportPromise);
    $: handleSort(reportData, $searchParams.sort);

    async function initializeFromReport(promise: typeof reportPromise) {
        reportData = await promise;
        if (!startDate) {
            startDate = reportData.startDate;
        }
        if (!endDate) {
            endDate = reportData.endDate;
        }
    }

    async function handleSort(reportData: DynamicReport | undefined, currentSort: string) {
        if (reportData && currentSort) {
            const sortReportTable = createListSorter<DynamicReportResult>(
                Object.fromEntries(reportData.columns.map((name, index) => [name, { primarySortKeys: [index] }]))
            );
            results = sortReportTable(reportData.results, currentSort);
        } else if (reportData) {
            results = reportData?.results;
        }
    }
</script>

<svelte:head>
    <title>{reportData?.name} | Aquifer Admin</title>
</svelte:head>

{#await Promise.all([reportPromise, companiesPromise])}
    <CenteredSpinner />
{:then [_, companies]}
    {#if reportData}
        <div class="flex h-full max-h-screen flex-col space-y-4 p-4">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl capitalize">{reportData.name}</h1>
                {#if reportData.type === DynamicReportType.Table && reportData.results.length > _defaultTableRowsPerPage}
                    <ReportTablePagination
                        bind:paginationStart={$searchParams.paginationStart}
                        bind:paginationEnd={$searchParams.paginationEnd}
                        perPage={_defaultTableRowsPerPage}
                        totalCount={reportData.results.length}
                    />
                {/if}
            </div>
            <div class="flex flex-row space-x-6">
                {#if reportData.acceptsLanguage}
                    <Select
                        bind:value={languageId}
                        isNumber={true}
                        class="select select-bordered min-w-[10rem] flex-shrink"
                        options={[
                            { value: 0, label: 'All Languages' },
                            ...data.languages.map((l) => ({ value: l.id, label: l.englishDisplay })),
                        ]}
                    />
                {/if}
                {#if reportData.acceptsParentResource}
                    <Select
                        bind:value={parentResourceId}
                        isNumber={true}
                        class="select select-bordered min-w-[10rem] flex-shrink"
                        options={[
                            { value: 0, label: 'All Resources' },
                            ...data.parentResources.map((t) => ({ value: t.id, label: t.displayName })),
                        ]}
                    />
                {/if}
                {#if reportData.acceptsCompany}
                    <Select
                        bind:value={companyId}
                        isNumber={true}
                        class="select select-bordered min-w-[10rem] flex-shrink"
                        options={[
                            { value: 0, label: 'Select Company' },
                            ...companies
                                .filter((c) => !companiesToIgnore.includes(c.name))
                                .map((c) => ({ value: c.id, label: c.name })),
                        ]}
                    />
                {/if}
                {#if reportData.acceptsDateRange}
                    <div class="flex flex-row items-center space-x-2">
                        <span>Date Range: </span>
                        <DatePicker bind:date={startDate} latestDate={endDate} />
                        <span>-</span>
                        <DatePicker bind:date={endDate} earliestDate={startDate} />
                    </div>
                {/if}
                {#if reportData.acceptsDateRange || reportData.acceptsLanguage || reportData.acceptsParentResource || reportData.acceptsCompany}
                    <button class="btn btn-link !mx-1" on:click={refetch}>
                        <Icon data={refresh} />
                    </button>
                {/if}
            </div>
            {#if reportData.type === DynamicReportType.BarChart}
                <div class="relative me-10 ms-5 h-full flex-shrink overflow-hidden">
                    <BarChart report={reportData} />
                </div>
            {:else if reportData.type === DynamicReportType.LineChart}
                <div class="relative me-10 ms-5 h-full flex-shrink overflow-hidden">
                    <LineChart report={reportData} />
                </div>
            {:else if reportData.type === DynamicReportType.Table}
                <div>
                    <div class="relative flex-shrink overflow-hidden">
                        <ReportTable
                            {searchParams}
                            report={reportData}
                            sortedAndPaginatedResults={results.slice(
                                $searchParams.paginationStart,
                                $searchParams.paginationEnd
                            )}
                        />
                    </div>
                </div>
            {:else}
                <p>Unsupported report type</p>
            {/if}
        </div>
    {/if}
{:catch error}
    <ErrorMessage uncastError={error} gotoPath={'/reporting'} />
{/await}
