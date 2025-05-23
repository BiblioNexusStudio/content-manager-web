<script lang="ts">
    import type { PageData } from './$types';
    import { DynamicReportType, type DynamicReportResult, type DynamicReport } from '$lib/types/reporting';
    import BarChart from '$lib/components/reporting/BarChartReport.svelte';
    import { searchParameters } from '$lib/utils/sveltekit-search-params';
    import { _searchParamsConfig, _defaultTableRowsPerPage } from './+page';
    import DatePicker from '$lib/components/DatePicker.svelte';
    import { Icon } from 'svelte-awesome';
    import refresh from 'svelte-awesome/icons/refresh';
    import { createListSorter } from '$lib/utils/sorting';
    import Select from '$lib/components/Select.svelte';
    import { companiesToIgnore } from '$lib/types/base';
    import ReportTablePagination from '$lib/components/reporting/ReportTablePagination.svelte';
    import ReportTable from '$lib/components/reporting/ReportTable.svelte';
    import LineChartReport from '$lib/components/reporting/LineChartReport.svelte';
    import { reportingPageLoading } from '$lib/stores/reporting';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    const searchParams = searchParameters(_searchParamsConfig, {
        runLoadAgainWhenParamsChange: ['startDate', 'endDate', 'languageId', 'parentResourceId', 'companyId'],
    });

    let startDate = $state($searchParams.startDate);
    let endDate = $state($searchParams.endDate);
    let languageId = $state($searchParams.languageId);
    let parentResourceId = $state($searchParams.parentResourceId);
    let companyId = $state($searchParams.companyId);
    let reportParamsUpdated = $state(false);

    let reportData = $derived(
        data?.reportData ?? {
            name: '',
            description: '',
            type: DynamicReportType.Table,
            acceptsDateRange: false,
            acceptsLanguage: false,
            acceptsParentResource: false,
            acceptsCompany: false,
            startDate: '',
            endDate: '',
            columns: [],
            results: [],
        }
    );

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
        reportParamsUpdated = false;
    }

    $effect(() => {
        initializeFromReport(reportData);
    });

    $effect(() => {
        if (
            startDate !== $searchParams.startDate ||
            endDate !== $searchParams.endDate ||
            languageId !== $searchParams.languageId ||
            parentResourceId !== $searchParams.parentResourceId ||
            companyId !== $searchParams.companyId
        ) {
            reportParamsUpdated = true;
        }
    });

    let sortReportTable = $derived(
        createListSorter<DynamicReportResult>(
            Object.fromEntries(reportData.columns.map((name, index) => [name, { primarySortKeys: [index] }]))
        )
    );

    let sortedResults = $derived(sortReportTable(reportData.results, $searchParams.sort));

    function initializeFromReport(reportData: DynamicReport) {
        if (!startDate) {
            startDate = reportData.startDate;
        }
        if (!endDate) {
            endDate = reportData.endDate;
        }
    }
</script>

<svelte:head>
    <title>{reportData.name} | Aquifer Admin</title>
</svelte:head>

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
                class="select select-bordered min-w-[10rem] shrink"
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
                class="select select-bordered min-w-[10rem] shrink"
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
                class="select select-bordered min-w-[10rem] shrink"
                options={[
                    { value: 0, label: 'Select Company' },
                    ...(data?.companies
                        ?.filter((c) => !companiesToIgnore.includes(c.name))
                        ?.map((c) => ({ value: c.id, label: c.name })) ?? []),
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
        {#if (reportData.acceptsDateRange || reportData.acceptsLanguage || reportData.acceptsParentResource || reportData.acceptsCompany) && (reportParamsUpdated || $reportingPageLoading)}
            <button class="btn btn-link mx-1! {$reportingPageLoading && 'animate-spin'}" onclick={refetch}>
                <Icon data={refresh} />
            </button>
        {/if}
    </div>
    {#if reportData.type === DynamicReportType.BarChart}
        <div class="relative ms-5 me-10 h-full shrink overflow-hidden">
            <BarChart report={reportData} />
        </div>
    {:else if reportData.type === DynamicReportType.LineChart}
        <div class="relative ms-5 me-10 h-full shrink overflow-hidden">
            <LineChartReport report={reportData} />
        </div>
    {:else if reportData.type === DynamicReportType.Table}
        <div>
            <div class="relative shrink overflow-hidden">
                <ReportTable
                    {searchParams}
                    report={reportData}
                    sortedAndPaginatedResults={sortedResults.slice(
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
