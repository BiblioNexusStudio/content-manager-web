<script lang="ts">
    import StarRating from '$lib/components/StarRating.svelte';
    import { patchToApi } from '$lib/utils/http-service';
    import type { MachineTranslation } from '$lib/types/resources';
    import type { MachineTranslationStore } from '$lib/stores/machineTranslation';

    export let machineTranslationStore: MachineTranslationStore;
    export let showingInPrompt = false;
    export let improvementHorizontalPositionPx = 60;

    let machineTranslation = machineTranslationStore.machineTranslation;
    let promptForRating = machineTranslationStore.promptForRating;
    let showImprovements = false;
    let showImprovementsDiv: HTMLDivElement;
    let skipFirstPatch = true; // prevent reactive function from running on load
    let ratedFromPrompt = false;

    $: updateMachineTranslation($machineTranslation);

    async function updateMachineTranslation(data: MachineTranslation) {
        if (skipFirstPatch) {
            skipFirstPatch = false;
            return;
        }

        machineTranslationStore.debounce(async () => {
            await patchToApi(`/resources/content/machine-translation/${$machineTranslation.id}`, { ...data });
        });
    }

    const onRating = async (e: MouseEvent, newRating: number) => {
        e.stopPropagation();

        showImprovements = newRating < 5;

        if (showingInPrompt) {
            ratedFromPrompt = true;
        } else {
            $promptForRating = false;
        }
    };

    const onAnyClick = (e: MouseEvent) => {
        if (showImprovementsDiv) {
            showImprovements = showImprovementsDiv.contains(e.target as Node);
        } else if (ratedFromPrompt) {
            $promptForRating = false;
        }
    };
</script>

<svelte:window on:click={onAnyClick} />
{#if showingInPrompt}
    <StarRating callback={onRating} bind:rating={$machineTranslation.userRating} />
{:else}
    <div class="tooltip tooltip-primary" data-tip="Rate AI translation">
        <StarRating callback={onRating} bind:rating={$machineTranslation.userRating} />
    </div>
{/if}
{#if showImprovements}
    <div
        bind:this={showImprovementsDiv}
        class="absolute z-50 -ms-[{improvementHorizontalPositionPx}px] mt-6 h-32 w-64 rounded border bg-white p-2"
    >
        <div>What needed improvement?</div>
        <div class="mt-2 flex flex-wrap gap-2">
            <input
                type="checkbox"
                bind:checked={$machineTranslation.improveClarity}
                aria-label="Clarity"
                class="btn btn-outline btn-primary btn-sm"
            />
            <input
                type="checkbox"
                bind:checked={$machineTranslation.improveTone}
                aria-label="Tone/Style"
                class="btn btn-outline btn-primary btn-sm"
            />
            <input
                type="checkbox"
                bind:checked={$machineTranslation.improveConsistency}
                aria-label="Consistency"
                class="btn btn-outline btn-primary btn-sm"
            />
        </div>
    </div>
{/if}
