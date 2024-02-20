<script lang="ts">
    import type { PageData } from './$types';
    import { unwrapStreamedData } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import MonthlyStartsAndCompletionsChart from '$lib/charts/MonthlyStartsAndCompletionsChart.svelte';

    export let data: PageData;
    $: reportType = data.reportType!;

    $: reportPromise = unwrapStreamedData(data.report!);
</script>

{#await reportPromise}
    <CenteredSpinner />
{:then report}
    <div class="mx-4 grid grid-cols-2">
        <div class="col-span-2 mb-6 mt-4 text-3xl">
            {reportType.charAt(0).toUpperCase() + reportType.slice(1)} History
        </div>

        <div class="me-10 ms-5">
            <MonthlyStartsAndCompletionsChart completesByMonth={report.completions} startsByMonth={report.starts} />
        </div>
    </div>
{/await}
