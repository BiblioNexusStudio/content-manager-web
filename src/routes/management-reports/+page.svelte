<script lang="ts">
    import Select from '$lib/components/Select.svelte';
    import { searchParameters } from '$lib/utils/sveltekit-search-params';
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { onMount } from 'svelte';
    import Modal from '$lib/components/Modal.svelte';
    import { _defaultTableRowsPerPage, _searchParamsConfig } from './+page';
    import Report from './Report.svelte';
    import { filterToOnlyDynamicReports } from '$lib/utils/reporting';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    let allReports = $derived(filterToOnlyDynamicReports(data?.managerDynamicReports ?? []));
    const searchParams = searchParameters(_searchParamsConfig, {
        runLoadAgainWhenParamsChange: ['startDate', 'endDate', 'languageId', 'parentResourceId', 'report'],
    });
    let report = $state($searchParams.report);
    let loading = $state(false);
    let reportOptions: {
        value: string | null | number;
        label: string;
    }[] = $state([]);

    let errorMessage = $state(null);

    onMount(() => {
        if ($searchParams.report === '' && allReports && allReports.length === 1) {
            $searchParams.report = allReports[0]!.slug;
        }
        if (allReports.length > 1) {
            reportOptions = [
                { value: '', label: 'Select Report' },
                ...allReports.map(({ name, slug }) => ({ value: slug, label: name })),
            ];
        } else if (allReports.length === 1) {
            reportOptions = [...allReports.map(({ name, slug }) => ({ value: slug, label: name }))];
        }
    });
</script>

<div class="flex h-full max-h-screen flex-col overflow-y-hidden p-4">
    <h1 class="mb-4 text-3xl capitalize">Reporting</h1>
    {#if errorMessage}
        <Modal
            isError
            header={'Viewing Report'}
            description={errorMessage}
            primaryButtonOnClick={() => {
                errorMessage = null;
                report = reportOptions[0]!.value! as string;
                loading = true;
                $searchParams.report = reportOptions[0]!.value as string;
                $searchParams.paginationStart = 0;
                $searchParams.paginationEnd = _defaultTableRowsPerPage;
            }}
            primaryButtonText={'Okay'}
        />
    {/if}
    {#if allReports.length}
        <div class="grid-cols-3">
            <Select
                class="select select-bordered max-w-[14rem] flex-grow"
                bind:value={report}
                onChange={(r) => {
                    loading = true;
                    $searchParams.report = r as string;
                    $searchParams.paginationStart = 0;
                    $searchParams.paginationEnd = _defaultTableRowsPerPage;
                    $searchParams.endDate = '';
                    $searchParams.startDate = '';
                    $searchParams.languageId = 0;
                    $searchParams.parentResourceId = 0;
                    return false;
                }}
                isNumber={false}
                options={reportOptions}
            />
        </div>
    {/if}
    <div class="divider"></div>

    {#if report !== ''}
        <Report parentResources={data.parentResources} languages={data.languages} bind:loading bind:errorMessage />
    {:else if allReports.length === 0}
        <p class="w-full text-center">No reports for managers at this time.</p>
    {:else if loading}
        <div class="max-h-52">
            <CenteredSpinner />
        </div>
    {/if}
</div>
