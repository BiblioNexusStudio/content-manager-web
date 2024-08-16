<script lang="ts">
    import refresh from 'svelte-awesome/icons/refresh';
    import { Icon } from 'svelte-awesome';
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import DailyResourceDownloadsBarChart from '$lib/charts/DailyResourceDownloadsBarChart.svelte';
    import DatePicker from '$lib/components/DatePicker.svelte';
    import { _searchParamsConfig } from './+page';
    import { searchParameters } from '$lib/utils/sveltekit-search-params';

    export let data: PageData;

    const searchParams = searchParameters(_searchParamsConfig, { runLoadAgainWhenParamsChange: true });

    let startDate = $searchParams.startDate;
    let endDate = $searchParams.endDate;

    function refetch() {
        $searchParams.startDate = startDate;
        $searchParams.endDate = endDate;
    }

    $: reportPromise = data.report!.promise;
</script>

<div class="flex max-h-screen flex-col space-y-4 p-4">
    <div class="text-3xl">Daily Resource Item Requests</div>

    <div class="flex flex-row items-center space-x-2">
        <span>Date Range: </span>
        <DatePicker bind:date={startDate} />
        <span>-</span>
        <DatePicker bind:date={endDate} />
        <button class="btn btn-link" on:click={refetch}>
            <Icon data={refresh} />
        </button>
    </div>

    {#await reportPromise}
        <CenteredSpinner />
    {:then report}
        <div class="relative me-10 ms-5 flex-shrink overflow-hidden">
            <DailyResourceDownloadsBarChart amountsByDay={report} />
        </div>
    {/await}
</div>
