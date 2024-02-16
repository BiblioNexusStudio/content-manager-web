<script lang="ts">
    import { project } from '$lib/stores/projects';
    import ViewTabSlot from './ViewTabSlot.svelte';
</script>

<div class="my-4 grid min-h-[192px] w-full grid-cols-2 gap-x-8">
    <div class="flex flex-col">
        <ViewTabSlot title="Source Words">
            {#if $project?.started === null}
                <input type="text" value={$project?.sourceWordCount ?? '0'} class="rounded border py-2 ps-4" />
            {:else}
                <div>{$project?.sourceWordCount ?? '0'}</div>
            {/if}
        </ViewTabSlot>
        <ViewTabSlot title="Efective Words">
            {#if $project?.started === null}
                <input type="text" value={$project?.effectiveWordCount ?? '0'} class="rounded border py-2 ps-4" />
            {:else}
                <div>{$project?.effectiveWordCount ?? '0'}</div>
            {/if}
        </ViewTabSlot>
    </div>
    <div class="flex flex-col">
        <ViewTabSlot title="Quoted Cost">
            {#if $project?.started === null}
                <input type="text" value={$project?.quotedCost ?? '0'} class="rounded border py-2 ps-4" />
            {:else}
                <div>{$project?.quotedCost ?? '0'}</div>
            {/if}
        </ViewTabSlot>
    </div>
</div>
