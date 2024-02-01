<script lang="ts">
    import type { ResourceContentForSelection } from './types';

    export let allContent: ResourceContentForSelection[];
    export let selectedIds: Set<number>;
    export let showTotalWordCount = false;

    $: allSelected = allContent.length > 0 && allContent.every((c) => selectedIds.has(c.resourceContentId));

    function selectOrDeselectAll() {
        if (allSelected) {
            allContent.forEach((c) => selectedIds.delete(c.resourceContentId));
        } else {
            allContent.forEach((c) => selectedIds.add(c.resourceContentId));
        }
        selectedIds = selectedIds;
    }

    function toggleSelectedId(resourceContentId: number) {
        if (selectedIds.has(resourceContentId)) {
            selectedIds.delete(resourceContentId);
        } else {
            selectedIds.add(resourceContentId);
        }
        selectedIds = selectedIds;
    }
</script>

<table class="table table-pin-rows">
    <thead>
        <tr class="bg-base-200">
            <th
                ><input
                    disabled={allContent.length === 0}
                    type="checkbox"
                    checked={allSelected}
                    on:change={selectOrDeselectAll}
                    class="checkbox"
                /></th
            >
            <th>Title</th>
            <th
                >Words
                {#if showTotalWordCount}
                    ({allContent.reduce((sum, content) => sum + content.wordCount, 0)})
                {/if}
            </th>
        </tr>
    </thead>
    <tbody>
        {#each allContent as content}
            <tr>
                <td
                    ><input
                        type="checkbox"
                        checked={selectedIds.has(content.resourceContentId)}
                        on:change={() => toggleSelectedId(content.resourceContentId)}
                        class="checkbox"
                    /></td
                >
                <td>{content.title}</td>
                <td>{content.wordCount}</td>
            </tr>
        {/each}
    </tbody>
</table>
