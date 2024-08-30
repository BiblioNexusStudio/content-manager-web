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
    import type { ResourceAssignedToSelf, ResourceAssignedToSelfHistory } from './+page';
    import Table from '$lib/components/Table.svelte';
    import { myHistoryColumns, myWorkColumns } from './editor-dashboard-columns';
    import TableCell from '$lib/components/TableCell.svelte';
    import { download } from '$lib/utils/csv-download-handler';
    import CenteredSpinnerFullScreen from '$lib/components/CenteredSpinnerFullScreen.svelte';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';

    const sortMyWorkData = createEditorDashboardMyWorkSorter();
    const sortMyHistoryData = createEditorDashboardMyHistorySorter();

    export let data: PageData;

    enum Tab {
        myWork = 'my-work',
        myHistory = 'my-history',
    }

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
        }
    };

    const searchParams = searchParameters(
        {
            sort: ssp.string(`-${SortName.Days}`),
            tab: ssp.string(Tab.myWork),
        },
        { runLoadAgainWhenParamsChange: false }
    );

    const setTabContents = (tab: string, search: string) => {
        if (tab === Tab.myWork) {
            visibleMyWorkContents = myWorkContents.filter((x) =>
                x.englishLabel.toLowerCase().includes(search.toLowerCase())
            );
        } else if (tab === Tab.myHistory) {
            visibleMyHistoryContents = myHistoryContents.filter((x) =>
                x.englishLabel.toLowerCase().includes(search.toLowerCase())
            );
        }
    };

    let search = '';
    let myWorkContents: ResourceAssignedToSelf[] = [];
    let visibleMyWorkContents: ResourceAssignedToSelf[] = [];
    let myHistoryContents: ResourceAssignedToSelfHistory[] = [];
    let visibleMyHistoryContents: ResourceAssignedToSelfHistory[] = [];
    let scrollingDiv: HTMLDivElement | undefined;
    $: $searchParams.sort && scrollingDiv && (scrollingDiv.scrollTop = 0);
    $: setTabContents($searchParams.tab, search);

    const loadContents = async () => {
        [myWorkContents, myHistoryContents] = await Promise.all([
            data.editorDashboard!.assignedResourceContent.promise,
            data.editorDashboard!.assignedResourceHistoryContent.promise,
        ]);
    };
</script>

{#await loadContents()}
    <CenteredSpinnerFullScreen />
{:then _}
    <div class="flex flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Editor Dashboard</h1>
        <div class="flex flex-row items-center pt-4">
            <div role="tablist" class="tabs-bordered tabs w-fit">
                <button
                    on:click={() => switchTabs(Tab.myWork)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.myWork && 'tab-active'}"
                    >My Work ({myWorkContents.length})</button
                >
                <button
                    on:click={() => switchTabs(Tab.myHistory)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.myHistory && 'tab-active'}"
                    >My History ({myHistoryContents.length})</button
                >
            </div>
        </div>
        <div class="mt-4 flex gap-4">
            <input class="input input-bordered max-w-xs focus:outline-none" bind:value={search} placeholder="Search" />
            {#if $searchParams.tab === Tab.myWork}
                <div class="my-1 ml-auto flex flex-col items-end justify-center">
                    <div class="text-sm text-gray-500">Total Items: {myWorkContents.length}</div>
                    <div class="text-sm text-gray-500">
                        Total Source Words: {myWorkContents
                            .reduce((sum, x) => sum + (x?.wordCount ?? 0), 0)
                            .toLocaleString()}
                    </div>
                </div>
            {/if}
            {#if $searchParams.tab === Tab.myHistory}
                <button
                    data-app-insights-event-name="editor-dashboard-download-my-history-csv-click"
                    class="btn btn-primary"
                    on:click={downloadMyHistoryCsv}>Download Word Counts</button
                >
            {/if}
        </div>
        <div bind:this={scrollingDiv} class="my-4 max-h-full flex-grow overflow-y-auto">
            {#if $searchParams.tab === Tab.myWork}
                <Table
                    columns={myWorkColumns}
                    items={sortMyWorkData(visibleMyWorkContents, $searchParams.sort)}
                    idColumn="id"
                    itemUrlPrefix="/resources/"
                    bind:searchParams={$searchParams}
                    noItemsText="Your work is all done!"
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
                    columns={myHistoryColumns}
                    items={sortMyHistoryData(visibleMyHistoryContents, $searchParams.sort)}
                    idColumn="id"
                    itemUrlPrefix="/resources/"
                    bind:searchParams={$searchParams}
                    noItemsText="Your work is all done!"
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
    </div>
{:catch error}
    <ErrorMessage uncastError={error} />
{/await}
