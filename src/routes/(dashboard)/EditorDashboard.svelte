<script lang="ts">
    import type { PageData } from './$types';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import {
        SortName,
        createEditorDashboardMyWorkSorter,
        createEditorDashboardMyHistorySorter,
    } from './dashboard-table-sorters';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import { formatSimpleDaysAgo, utcDateTimeStringToDateTime } from '$lib/utils/date-time';
    import { type ResourceAssignedToSelf, type ResourceAssignedToSelfHistory, _EditorTab as Tab } from './+page';
    import Table from '$lib/components/Table.svelte';
    import { myHistoryColumns, myWorkColumns } from './editor-dashboard-columns';
    import TableCell from '$lib/components/TableCell.svelte';
    import { download } from '$lib/utils/csv-download-handler';
    import Select from '$lib/components/Select.svelte';
    import { filterBoolean } from '$lib/utils/array';
    import { untrack } from 'svelte';

    const sortMyWorkData = createEditorDashboardMyWorkSorter();
    const sortMyHistoryData = createEditorDashboardMyHistorySorter();

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let myWorkContents = $derived(data.editorDashboard!.assignedResourceContent);
    let myHistoryContents = $derived(data.editorDashboard!.assignedResourceHistoryContent);

    const downloadMyHistoryCsv = () => {
        download(
            myHistoryContents.map((x) => ({
                ...x,
                lastActionTime: utcDateTimeStringToDateTime(x.lastActionTime).toLocaleDateString(),
            })),
            `my-history-${new Date().toISOString()}`,
            {
                englishLabel: 'Title',
                parentResourceName: 'Resource',
                lastActionTime: 'My Last Action',
                sourceWords: 'Source Words',
            }
        );
    };

    const switchTabs = (tab: Tab) => {
        if ($searchParams.tab !== tab) {
            $searchParams.tab = tab;
            $searchParams.sort = '-' + SortName.Days;
        }
    };

    const searchParams = searchParameters(
        {
            sort: ssp.string(`-${SortName.Days}`),
            tab: ssp.string(Tab.myWork),
            project: ssp.string(''),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    const setTabContents = (tab: string, search: string, project: string) => {
        if (tab === Tab.myWork) {
            visibleMyWorkContents = myWorkContents.filter(
                (x) =>
                    x.englishLabel.toLowerCase().includes(search.toLowerCase()) &&
                    (!project || x.projectName === project)
            );
        } else if (tab === Tab.myHistory) {
            visibleMyHistoryContents = myHistoryContents.filter((x) =>
                x.englishLabel.toLowerCase().includes(search.toLowerCase())
            );
        }
    };

    let search = $state('');
    let visibleMyWorkContents: ResourceAssignedToSelf[] = $state([]);
    let visibleMyHistoryContents: ResourceAssignedToSelfHistory[] = $state([]);
    let table: Table<ResourceAssignedToSelfHistory> | Table<ResourceAssignedToSelf> | undefined = $state(undefined);

    $effect(() => {
        if ($searchParams.sort && table !== undefined) {
            untrack(() => table?.resetScroll());
        }
    });

    $effect(() => {
        setTabContents($searchParams.tab, search, $searchParams.project);
    });

    $effect(() => {
        visibleMyWorkContents = sortMyWorkData(visibleMyWorkContents, $searchParams.sort);
    });

    $effect(() => {
        visibleMyHistoryContents = sortMyHistoryData(visibleMyHistoryContents, $searchParams.sort);
    });

    function projectNamesForContents(contents: ResourceAssignedToSelf[]) {
        return Array.from(new Set(filterBoolean(contents.map((c) => c.projectName)))).sort();
    }
</script>

<div class="flex flex-col overflow-y-hidden px-4">
    <h1 class="pt-4 text-3xl">Dashboard</h1>
    <div class="flex flex-row items-center pt-4">
        <div role="tablist" class="tabs tabs-bordered w-fit">
            <button
                onclick={() => switchTabs(Tab.myWork)}
                role="tab"
                class="tab {$searchParams.tab === Tab.myWork && 'tab-active'}">My Work ({myWorkContents.length})</button
            >
            <button
                onclick={() => switchTabs(Tab.myHistory)}
                role="tab"
                class="tab {$searchParams.tab === Tab.myHistory && 'tab-active'}"
                >My History ({myHistoryContents.length})</button
            >
        </div>
    </div>
    <div class="mt-4 flex gap-4">
        <input class="input input-bordered max-w-xs focus:outline-none" bind:value={search} placeholder="Search" />
        {#if $searchParams.tab === Tab.myWork}
            <Select
                class="select select-bordered max-w-[14rem] flex-grow"
                bind:value={$searchParams.project}
                options={[
                    { value: '', label: 'Project' },
                    ...projectNamesForContents(myWorkContents).map((p) => ({ value: p, label: p })),
                ]}
            />
        {/if}
        {#if $searchParams.tab === Tab.myWork}
            <div class="my-1 ml-auto flex flex-col items-end justify-center">
                <div class="text-sm text-gray-500">Total Items: {visibleMyWorkContents.length}</div>
                <div class="text-sm text-gray-500">
                    Total Source Words: {visibleMyWorkContents
                        .reduce((sum, x) => sum + (x?.wordCount ?? 0), 0)
                        .toLocaleString()}
                </div>
            </div>
        {/if}
        {#if $searchParams.tab === Tab.myHistory}
            <button
                data-app-insights-event-name="editor-dashboard-download-my-history-csv-click"
                class="btn btn-primary"
                onclick={downloadMyHistoryCsv}>Download Word Counts</button
            >
        {/if}
    </div>
    {#if $searchParams.tab === Tab.myWork}
        <Table
            bind:this={table}
            class="my-4"
            columns={myWorkColumns}
            items={visibleMyWorkContents}
            idColumn="id"
            itemUrlPrefix="/resources/"
            bind:searchParams={$searchParams}
            noItemsText="Your work is all done!"
            searchable={true}
            searchText={search}
            noItemsAfterSearchText="No items found"
            let:item
            let:href
            let:itemKey
        >
            {#if itemKey === 'daysSinceContentUpdated' && item[itemKey] !== null}
                <LinkedTableCell {href}>{formatSimpleDaysAgo(item[itemKey])}</LinkedTableCell>
            {:else if href !== undefined && itemKey}
                <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
            {:else if itemKey}
                <TableCell>{item[itemKey] ?? ''}</TableCell>
            {/if}
        </Table>
    {:else if $searchParams.tab === Tab.myHistory}
        <Table
            bind:this={table}
            class="my-4"
            columns={myHistoryColumns}
            items={visibleMyHistoryContents}
            idColumn="id"
            itemUrlPrefix="/resources/"
            bind:searchParams={$searchParams}
            noItemsText="No history items"
            searchable={true}
            searchText={search}
            noItemsAfterSearchText="No items found"
            let:item
            let:href
            let:itemKey
        >
            {#if itemKey === 'lastActionTime' && item[itemKey] !== null}
                <LinkedTableCell {href}
                    >{utcDateTimeStringToDateTime(item[itemKey]).toLocaleDateString()}</LinkedTableCell
                >
            {:else if href !== undefined && itemKey}
                <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
            {:else if itemKey}
                <TableCell>{item[itemKey] ?? ''}</TableCell>
            {/if}
        </Table>
    {/if}
</div>
