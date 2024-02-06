<script lang="ts">
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import type { ResourceContentForSelection } from './types';

    export let allContent: ResourceContentForSelection[];
    export let selectedIds: Set<number>;
    export let showTotalWordCount = false;
    export let isLoading = false;

    $: allSelected = allContent.length > 0 && allContent.every((c) => selectedIds.has(c.resourceId));

    function selectOrDeselectAll() {
        if (allSelected) {
            allContent.forEach((c) => selectedIds.delete(c.resourceId));
        } else {
            allContent.forEach((c) => selectedIds.add(c.resourceId));
        }
        selectedIds = selectedIds;
    }

    function toggleSelectedId(resourceId: number) {
        if (selectedIds.has(resourceId)) {
            selectedIds.delete(resourceId);
        } else {
            selectedIds.add(resourceId);
        }
        selectedIds = selectedIds;
    }
</script>

<table class="table table-pin-rows">
    <thead>
        <tr class="bg-base-200">
            <th class="w-[1px]"
                ><input
                    disabled={allContent.length === 0}
                    type="checkbox"
                    checked={allSelected}
                    on:change={selectOrDeselectAll}
                    class="checkbox"
                /></th
            >
            <th>Title</th>
            <th class="w-[1px]"
                >Words
                {#if showTotalWordCount}
                    ({allContent.reduce((sum, content) => sum + content.wordCount, 0).toLocaleString()})
                {/if}
            </th>
        </tr>
    </thead>
    <tbody>
        {#if isLoading}
            <tr>
                <td colspan="3">
                    <CenteredSpinner />
                </td>
            </tr>
        {:else}
            {#each allContent as content}
                <tr class="cursor-pointer" on:click={() => toggleSelectedId(content.resourceId)}>
                    <td><input type="checkbox" checked={selectedIds.has(content.resourceId)} class="checkbox" /></td>
                    <td>{content.title}</td>
                    <td>{content.wordCount}</td>
                </tr>
            {/each}
        {/if}
    </tbody>
</table>
