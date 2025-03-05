<script lang="ts">
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import type {ResourceContentForSelection} from './types';

    interface Props {
        allContent: ResourceContentForSelection[];
        selectedIds: number[];
        showTotalWordCount?: boolean;
        isLoading?: boolean;
        hasSearched?: boolean;
    }

    let {
        allContent,
        selectedIds = $bindable(),
        isLoading = false,
        hasSearched = false,
    }: Props = $props();

    let allSelected = $derived(
        allContent.length > 0 && allContent.every((c) => selectedIds.some((id) => id === c.resourceId))
    );

    let selectedContent = $derived(
        allContent.filter((c) => selectedIds.includes(c.resourceId))
    );

    function selectOrDeselectAll() {
        if (allSelected) {
            selectedIds = selectedIds.filter((id) => !allContent.some((c) => c.resourceId === id));
        } else {
            allContent.forEach((c) => selectedIds.push(c.resourceId));
        }
        selectedIds = [...new Set(selectedIds)];
    }

    function toggleSelectedId(resourceId: number) {
        if (selectedIds.some((id) => id === resourceId)) {
            selectedIds = selectedIds.filter((id) => id !== resourceId);
        } else {
            selectedIds.push(resourceId);
        }
        selectedIds = selectedIds;
    }
</script>

<table class="table table-pin-rows">
    <thead>
    <tr class="bg-base-200">
        <th class="w-[1px]"
        ><input
                checked={allSelected}
                class="checkbox"
                disabled={allContent.length === 0}
                onchange={selectOrDeselectAll}
                type="checkbox"
        /></th
        >
        <th>Title ({allContent.length} total)
            {#if selectedIds.length > 0}
                ({selectedIds.length} selected)
            {/if}
        </th>
        <th class="w-[1px]"
        >Words
            ({allContent.reduce((sum, content) => sum + content.wordCount, 0).toLocaleString()} total)
            {#if selectedIds.length > 0}
                ({selectedContent.reduce((sum, content) => sum + content.wordCount, 0).toLocaleString()} selected)
            {/if}
        </th>
    </tr>
    </thead>
    <tbody>
    {#if isLoading}
        <tr>
            <td colspan="99">
                <CenteredSpinner/>
            </td>
        </tr>
    {:else}
        {#each allContent as content (content.resourceId)}
            <tr class="cursor-pointer" onclick={() => toggleSelectedId(content.resourceId)}>
                <td
                ><input
                        type="checkbox"
                        checked={selectedIds.some((id) => id === content.resourceId)}
                        class="checkbox"
                /></td
                >
                <td>{content.title}</td>
                <td class="text-end">{content.wordCount}</td>
            </tr>
        {:else}
            {#if hasSearched}
                <tr>
                    <td colspan="99">
                        <div class="text-center">No results</div>
                    </td>
                </tr>
            {/if}
        {/each}
    {/if}
    </tbody>
</table>
