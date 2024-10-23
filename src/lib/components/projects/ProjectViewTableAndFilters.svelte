<script lang="ts">
    import { project } from '$lib/stores/projects';
    import Table from '$lib/components/Table.svelte';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import TableCell from '$lib/components/TableCell.svelte';
    import Select from '$lib/components/Select.svelte';
    import { projectViewTableColumns } from './project-view-table-columns';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import { SortName, createProjectViewListSorter } from './project-view-table-sorter';
    import type { ProjectResource } from '$lib/types/projects';

    let items = $project?.items ?? [];
    const projectViewSorter = createProjectViewListSorter<ProjectResource>();

    const searchParams = searchParameters(
        { sort: ssp.string(SortName.Title), assignedUserName: ssp.string(''), status: ssp.string('') },
        { runLoadAgainWhenParamsChange: false }
    );

    $: filterItems($searchParams.assignedUserName, $searchParams.status);

    function createOptions(label: string, key: keyof ProjectResource) {
        const uniqueMap = new Map();

        $project?.items
            .filter((p) => p?.[key])
            .forEach((p) => {
                uniqueMap.set(p[key], {
                    value: p?.[key] ?? '',
                    label: p?.[key] ?? '',
                });
            }) ?? [];

        return [{ value: '', label }, ...Array.from(uniqueMap.values())];
    }

    function filterItems(assignedUserName: string, status: string) {
        items =
            $project?.items?.filter(
                (p) =>
                    (assignedUserName === '' || p.assignedUserName === assignedUserName) &&
                    (status === '' || p.statusDisplayName === status)
            ) ?? [];
    }
</script>

{#if $project?.items}
    <div class="mb-4 flex pt-2">
        <Select
            class="select select-bordered me-4 max-w-[18rem] flex-grow"
            bind:value={$searchParams.assignedUserName}
            isNumber={false}
            options={createOptions('Assigned', 'assignedUserName')}
        />
        <Select
            class="select select-bordered me-4 max-w-[18rem] flex-grow"
            bind:value={$searchParams.status}
            isNumber={false}
            options={createOptions('Status', 'statusDisplayName')}
        />
    </div>

    <Table
        class="rounded-md border"
        columns={projectViewTableColumns}
        items={projectViewSorter(items, $searchParams.sort)}
        idColumn="resourceContentId"
        enableSelectAll={false}
        enableSelect={false}
        searchable={false}
        bind:searchParams={$searchParams}
        itemUrlPrefix="/resources/"
        noItemsText="No items found."
        let:item
        let:href
        let:itemKey
    >
        {#if itemKey === 'assignedUserName'}
            <td>
                <LinkedTableCell {href}
                    >{item[itemKey] ??
                        (item['statusDisplayName']?.includes('Editor Review') ? 'External User' : '')}</LinkedTableCell
                >
            </td>
        {:else if href !== undefined && itemKey}
            <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
        {:else if itemKey}
            <TableCell>{item[itemKey] ?? ''}</TableCell>
        {/if}
    </Table>
{/if}
