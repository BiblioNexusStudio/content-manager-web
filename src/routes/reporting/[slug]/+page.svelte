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

    export let data: PageData;

    const searchParams = searchParameters(_searchParamsConfig, {
        runLoadAgainWhenParamsChange: ['startDate', 'endDate'],
    });

    let startDate = $searchParams.startDate;
    let endDate = $searchParams.endDate;
    let reportData: DynamicReport | undefined;
    let results: DynamicReportResult[] = [];

    function refetch() {
        $searchParams.startDate = startDate;
        $searchParams.endDate = endDate;
    }

    $: reportPromise = data.reportData!.promise;

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

{#await reportPromise}
    <CenteredSpinner />
{:then _}
    {#if reportData}
        <div class="flex max-h-screen flex-col space-y-4 p-4">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl capitalize">{reportData.name}</h1>
                {#if reportData.type === DynamicReportType.Table}
                    <ReportTablePagination
                        bind:paginationStart={$searchParams.paginationStart}
                        bind:paginationEnd={$searchParams.paginationEnd}
                        perPage={_defaultTableRowsPerPage}
                        totalCount={reportData.results.length}
                    />
                {/if}
            </div>
            {#if reportData.acceptsDateRange}
                <div class="flex flex-row items-center space-x-2">
                    <span>Date Range: </span>
                    <DatePicker bind:date={startDate} />
                    <span>-</span>
                    <DatePicker bind:date={endDate} />
                    <button class="btn btn-link" on:click={refetch}>
                        <Icon data={refresh} />
                    </button>
                </div>
            {/if}
            <div>
                {#if reportData.type === DynamicReportType.BarChart}
                    <div class="relative me-10 ms-5 flex-shrink overflow-hidden">
                        <BarChart report={reportData} />
                    </div>
                {:else if reportData.type === DynamicReportType.LineChart}
                    <div class="relative me-10 ms-5 flex-shrink overflow-hidden">
                        <LineChart report={reportData} />
                    </div>
                {:else if reportData.type === DynamicReportType.Table}
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
                {:else}
                    <p>Unsupported report type</p>
                {/if}
            </div>
        </div>
    {/if}
{/await}
