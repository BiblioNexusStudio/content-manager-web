<script lang="ts">
    import { project } from '$lib/stores/projects';
    import Table from '$lib/components/Table.svelte';
    import LinkedTableCell from '$lib/components/LinkedTableCell.svelte';
    import TableCell from '$lib/components/TableCell.svelte';
    import { projectViewTableColumns } from './project-view-table-columns';
    import { searchParameters, ssp } from '$lib/utils/sveltekit-search-params';
    import { SortName, createProjectViewListSorter } from './project-view-table-sorter';
    import type { ProjectResource } from '$lib/types/projects';

    const projectViewSorter = createProjectViewListSorter<ProjectResource>();

    const searchParams = searchParameters(
        { sort: ssp.string(SortName.Title) },
        { runLoadAgainWhenParamsChange: false }
    );
</script>

{#if $project?.items}
    <div class="w-full overflow-auto">
        <Table
            columns={projectViewTableColumns}
            items={projectViewSorter($project.items, $searchParams.sort)}
            idColumn="resourceContentId"
            enableSelectAll={false}
            enableSelect={false}
            searchable={false}
            bind:searchParams={$searchParams}
            itemUrlPrefix="/resources/"
            let:item
            let:href
            let:itemKey
        >
            {#if itemKey === 'assignedUserName'}
                <td>
                    <LinkedTableCell {href}
                        >{item[itemKey] ??
                            (item['statusDisplayName']?.includes('In Progress')
                                ? 'External User'
                                : '')}</LinkedTableCell
                    >
                </td>
            {:else if href !== undefined && itemKey}
                <LinkedTableCell {href}>{item[itemKey] ?? ''}</LinkedTableCell>
            {:else if itemKey}
                <TableCell>{item[itemKey] ?? ''}</TableCell>
            {/if}
        </Table>
    </div>
{/if}
