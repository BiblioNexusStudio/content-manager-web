<script lang="ts">
    import { project } from '$lib/stores/projects';
</script>

<div class="my-4 grid min-h-[120px] w-full grid-cols-2 gap-x-8">
    <div class="flex flex-col">
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Source Words</div>
            {#if $project?.started === null}
                <input type="text" value={$project?.sourceWordCount ?? '0'} class="rounded border ps-4" />
            {:else}
                <div>{$project?.sourceWordCount ?? '0'}</div>
            {/if}
        </div>
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Efective Words</div>
            {#if $project?.started === null}
                <input type="text" value={$project?.effectiveWordCount ?? '0'} class="rounded border ps-4" />
            {:else}
                <div>{$project?.effectiveWordCount ?? '0'}</div>
            {/if}
        </div>
    </div>
    <div class="flex flex-col">
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Quoted Cost</div>
            <div>{$project?.quotedCost ?? ''}</div>
        </div>
    </div>
</div>
