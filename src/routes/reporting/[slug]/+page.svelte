<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { DynamicReportType } from '$lib/types/reporting';
    import BarChart from './BarChart.svelte';
    import { searchParameters } from '$lib/utils/sveltekit-search-params';
    import { _searchParamsConfig } from './+page';
    import DatePicker from '$lib/components/DatePicker.svelte';
    import { Icon } from 'svelte-awesome';
    import refresh from 'svelte-awesome/icons/refresh';
    import LineChart from './LineChart.svelte';

    export let data: PageData;

    const searchParams = searchParameters(_searchParamsConfig, { runLoadAgainWhenParamsChange: true });

    let startDate = $searchParams.startDate;
    let endDate = $searchParams.endDate;

    function refetch() {
        $searchParams.startDate = startDate;
        $searchParams.endDate = endDate;
    }

    $: reportPromise = data.reportData!.promise;

    $: maybeSetStartAndEndDate(reportPromise);

    async function maybeSetStartAndEndDate(promise: typeof reportPromise) {
        const reportData = await promise;
        if (!startDate) {
            startDate = reportData.startDate;
        }
        if (!endDate) {
            endDate = reportData.endDate;
        }
    }
</script>

{#await reportPromise}
    <CenteredSpinner />
{:then reportData}
    <div class="flex max-h-screen flex-col space-y-4 p-4">
        <div class="flex items-center justify-between">
            <h1 class="text-3xl capitalize">{reportData.name}</h1>
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
            {:else}
                <p>Unsupported report type</p>
            {/if}
        </div>
    </div>
{/await}
