<script lang="ts">
    import { project } from '$lib/stores/projects';
    import ViewTabSlot from './ViewTabSlot.svelte';
    import { updateProject } from '$lib/utils/projects';
    import { formatCurrency, formatNumberWithCommas } from '$lib/utils/projects';

    async function updateEffectiveWordCount(event: Event) {
        const effectiveWordCount = (event.target as HTMLInputElement).value;

        if ($project) {
            await updateProject($project.id, { effectiveWordCount: parseInt(effectiveWordCount) });
            $project.effectiveWordCount = parseInt(effectiveWordCount);
        }
    }

    async function updateQuotedCost(event: Event) {
        const quotedCost = (event.target as HTMLInputElement).value;

        if ($project) {
            await updateProject($project.id, { quotedCost: parseInt(quotedCost) });
            $project.quotedCost = parseInt(quotedCost);
        }
    }
</script>

<div class="my-4 grid min-h-[192px] w-full grid-cols-2 gap-x-8">
    <div class="flex flex-col">
        <ViewTabSlot title="Source Words">
            <div>{formatNumberWithCommas($project?.sourceWordCount ?? '0')}</div>
        </ViewTabSlot>
        <ViewTabSlot title="Efective Words">
            {#if $project?.started === null}
                <input
                    type="text"
                    on:blur={(e) => updateEffectiveWordCount(e)}
                    value={$project?.effectiveWordCount ?? '0'}
                    class="rounded border py-2 ps-4"
                />
            {:else}
                <div>{formatNumberWithCommas($project?.effectiveWordCount ?? '0')}</div>
            {/if}
        </ViewTabSlot>
    </div>
    <div class="flex flex-col">
        <ViewTabSlot title="Quoted Cost">
            {#if $project?.started === null}
                <input
                    type="text"
                    on:blur={(e) => updateQuotedCost(e)}
                    value={$project?.quotedCost ?? '0'}
                    class="rounded border py-2 ps-4"
                />
            {:else}
                <div>{formatCurrency($project?.quotedCost ?? 0)}</div>
            {/if}
        </ViewTabSlot>
    </div>
</div>
