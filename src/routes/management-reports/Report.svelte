<script lang="ts">
    import DatePicker from '$lib/components/DatePicker.svelte';
    import Select from '$lib/components/Select.svelte';
    import { companiesToIgnore, type Company, type Language, type ParentResource } from '$lib/types/base';
    import { DynamicReportType, type DynamicReport, type DynamicReportResult } from '$lib/types/reporting';
    import Icon from 'svelte-awesome';
    import { refresh } from 'svelte-awesome/icons';
    import { createListSorter } from '$lib/utils/sorting';
    import { buildQueryString, searchParameters } from '$lib/utils/sveltekit-search-params';
    import { getFromApi } from '$lib/utils/http-service';
    import { page } from '$app/state';
    import { onMount } from 'svelte';
    import { isAuthorizationError } from '$lib/utils/http-errors';
    import { _defaultTableRowsPerPage, _searchParamsConfig } from './+page';
    import ReportTablePagination from '$lib/components/reporting/ReportTablePagination.svelte';
    import BarChartReport from '$lib/components/reporting/BarChartReport.svelte';
    import LineChartReport from '$lib/components/reporting/LineChartReport.svelte';
    import ReportTable from '$lib/components/reporting/ReportTable.svelte';
    import { currentUser } from '$lib/stores/auth';

    interface Props {
        reportData?: DynamicReport | null;
        companies: Company[];
        languages: Language[];
        parentResources: ParentResource[];
        loading?: boolean;
        errorMessage?: string | null;
    }

    let {
        reportData = $bindable(),
        companies,
        languages,
        parentResources,
        loading = $bindable(),
        errorMessage = $bindable(),
    }: Props = $props();

    const searchParams = searchParameters(_searchParamsConfig, {
        runLoadAgainWhenParamsChange: false,
    });

    let startDate = $state($searchParams.startDate);
    let endDate = $state($searchParams.endDate);
    let languageId = $state($searchParams.languageId);
    let parentResourceId = $state($searchParams.parentResourceId);
    let report = $derived($searchParams.report);

    $effect(() => {
        initializeFromReport(reportData);
    });

    function initializeFromReport(reportData?: DynamicReport | null) {
        if (reportData) {
            if (!startDate) {
                startDate = reportData.startDate;
            }
            if (!endDate) {
                endDate = reportData.endDate;
            }
        }
    }
    async function fetchReport() {
        console.log($currentUser?.company);
        let companyId = reportData?.acceptsCompany ? ($currentUser?.company.id ?? 0) : 0;

        const queryString = buildQueryString([
            { key: 'startDate', value: $searchParams.startDate, ignoreIfEquals: '' },
            { key: 'endDate', value: $searchParams.endDate, ignoreIfEquals: '' },
            { key: 'languageId', value: $searchParams.languageId, ignoreIfEquals: 0 },
            { key: 'parentResourceId', value: $searchParams.parentResourceId, ignoreIfEquals: 0 },
            { key: 'companyId', value: companyId, ignoreIfEquals: 0 },
        ]);

        try {
            reportData = await getFromApi<DynamicReport>(
                `/reports/dynamic/${page.params.slug ?? report}?${queryString}`,
                fetch
            );
        } catch (error) {
            if (isAuthorizationError(error)) {
                errorMessage = 'You are not authorized to see this report.';
            } else {
                errorMessage = 'An error occurred.';
            }
        } finally {
            loading = false;
        }
    }

    function refetch() {
        loading = true;
        if (
            startDate !== $searchParams.startDate ||
            endDate !== $searchParams.endDate ||
            languageId !== $searchParams.languageId ||
            parentResourceId !== $searchParams.parentResourceId
        ) {
            $searchParams.paginationStart = 0;
            $searchParams.paginationEnd = _defaultTableRowsPerPage;
        }

        $searchParams.startDate = startDate ?? '';
        $searchParams.endDate = endDate ?? '';
        $searchParams.languageId = languageId;
        $searchParams.parentResourceId = parentResourceId;

        fetchReport();
    }

    let sortReportTable = $derived(
        reportData &&
            createListSorter<DynamicReportResult>(
                Object.fromEntries(reportData.columns.map((name, index) => [name, { primarySortKeys: [index] }]))
            )
    );

    let sortedResults = $derived(
        reportData && sortReportTable && sortReportTable(reportData.results, $searchParams.sort)
    );

    onMount(() => {
        fetchReport();
    });
</script>

{#if reportData}
    <div class="flex max-h-full max-h-screen flex-shrink flex-col space-y-4 overflow-y-auto">
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
                        ...languages.map((l) => ({ value: l.id, label: l.englishDisplay })),
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
                        ...parentResources.map((t) => ({ value: t.id, label: t.displayName })),
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
                <button class="btn btn-link mx-1!" onclick={refetch}>
                    <Icon data={refresh} />
                </button>
            {/if}
        </div>
        {#if reportData.type === DynamicReportType.BarChart}
            <div class="relative ms-5 me-10 h-full flex-shrink overflow-hidden">
                <BarChartReport report={reportData} />
            </div>
        {:else if reportData.type === DynamicReportType.LineChart}
            <div class="relative ms-5 me-10 h-full flex-shrink overflow-hidden">
                <LineChartReport report={reportData} />
            </div>
        {:else if reportData.type === DynamicReportType.Table && sortedResults}
            <ReportTable
                {searchParams}
                report={reportData}
                sortedAndPaginatedResults={sortedResults.slice(
                    $searchParams.paginationStart,
                    $searchParams.paginationEnd
                )}
            />
        {:else}
            <p>Unsupported report type</p>
        {/if}
    </div>
{/if}
