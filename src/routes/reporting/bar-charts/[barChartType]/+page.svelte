<script lang="ts">
    import type { PageData } from './$types';
    import { unwrapStreamedData } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import DailyResourceDownloadsBarChart from '$lib/charts/DailyResourceDownloadsBarChart.svelte';

    export let data: PageData;

    $: reportPromise = unwrapStreamedData(data.report!);
</script>

{#await reportPromise}
    <CenteredSpinner />
{:then report}
    <div class="mx-4 grid grid-cols-2">
        <div class="col-span-2 mb-6 mt-4 text-3xl">Daily Resource Item Requests</div>

        <div class="me-10 ms-5">
            <DailyResourceDownloadsBarChart amountsByMonth={report} />
        </div>
    </div>
{/await}
