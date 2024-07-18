<script lang="ts">
    import type { PageData } from './$types';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import { SortName, createEditorDashboardSorter } from './dashboard-table-sorters';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import { formatSimpleDaysAgo } from '$lib/utils/date-time';
    import type { ResourceAssignedToSelf } from './+page';
    import Table from '$lib/components/Table.svelte';
    import { myWorkColumns } from './editor-dashboard-columns';
    import TableCell from '$lib/components/TableCell.svelte';

    const sortData = createEditorDashboardSorter();

    export let data: PageData;

    enum Tab {
        myWork = 'my-work',
        myHistory = 'my-history',
    }

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

    let resourceContents: ResourceAssignedToSelf[] = [];
    let scrollingDiv: HTMLDivElement | undefined;
    $: $searchParams.sort && scrollingDiv && (scrollingDiv.scrollTop = 0);

    const loadContents = async () => {
        const resourceContentsPromise = data.editorDashboard!.resourceContent.promise;

        [resourceContents] = await Promise.all([resourceContentsPromise]);
    };
</script>

{#await loadContents()}
    <CenteredSpinner />
{:then _}
    <div class="flex max-h-screen flex-col overflow-y-hidden px-4">
        <h1 class="pt-4 text-3xl">Editor Dashboard</h1>
        <div class="flex flex-row items-center pt-4">
            <div role="tablist" class="tabs-bordered tabs w-fit">
                <button
                    on:click={() => switchTabs(Tab.myWork)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.myWork && 'tab-active'}"
                    >My Work ({resourceContents.length})</button
                >
                <button
                    on:click={() => switchTabs(Tab.myHistory)}
                    role="tab"
                    class="tab {$searchParams.tab === Tab.myHistory && 'tab-active'}">My History ({0})</button
                >
            </div>
        </div>
        <div bind:this={scrollingDiv} class="my-4 max-h-full flex-grow overflow-y-auto">
            {#if $searchParams.tab === Tab.myWork}
                <Table
                    columns={myWorkColumns}
                    items={sortData(resourceContents, $searchParams.sort)}
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
                <div>data goes here</div>
            {/if}
        </div>
    </div>
{/await}
