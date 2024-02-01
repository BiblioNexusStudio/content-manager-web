<script lang="ts">
    import type { PageData } from './$types';
    import { unwrapStreamedData } from '$lib/utils/http-service';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import ReportTable from '$lib/components/reporting/ReportTable.svelte';
    import ReportTablePagination from '$lib/components/reporting/ReportTablePagination.svelte';
    import { showSideBar } from '$lib/stores/app';

    export let data: PageData;
    $showSideBar = false;

    $: listPromise = unwrapStreamedData(data.listData);
    $: listId = formatListName(data.listId);

    function formatListName(listName: string) {
        return listName.replace(/-/g, ' ');
    }
</script>

{#await listPromise}
    <CenteredSpinner />
{:then listData}
    <div class="m-4 flex flex-col">
        <div class="mb-4 flex items-center justify-between">
            <h1 class="text-3xl capitalize">{listId}</h1>
            <ReportTablePagination tableData={listData} />
        </div>
        <div>
            <ReportTable />
        </div>
    </div>
{/await}
