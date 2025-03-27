<script lang="ts">
    import { DynamicReportType } from '$lib/types/reporting';
    import type { PageData } from './$types';
    import { _defaultTableRowsPerPage, _searchParamsConfig } from '../../../../lib/components/reporting/Constants';
    import Report from '../../Report.svelte';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let reportData = $state(
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
</script>

<svelte:head>
    <title>{reportData.name} | Aquifer Admin</title>
</svelte:head>
{#if reportData}
    <Report
        bind:reportData
        companies={data.companies}
        languages={data.languages}
        parentResources={data.parentResources}
    />
{/if}
