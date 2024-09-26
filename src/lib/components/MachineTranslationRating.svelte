<script lang="ts">
    import StarRating from '$lib/components/StarRating.svelte';
    import { patchToApi } from '$lib/utils/http-service';
    import type { MachineTranslation } from '$lib/types/resources';
    import type { MachineTranslationStore } from '$lib/stores/machineTranslation';

    export let itemIndex: number;
    export let machineTranslationStore: MachineTranslationStore;
    export let showingInPrompt = false;
    export let improvementHorizontalPositionPx = 60;

    let store = machineTranslationStore.machineTranslations;
    $: machineTranslation = $store.get(itemIndex)!;
    let promptForRating = machineTranslationStore.promptForRating;
    let showImprovements = false;
    let showImprovementsDiv: HTMLDivElement;
    let skipFirstPatch = true; // prevent reactive function from running on load
    let ratedFromPrompt = false;
    let currentComponentUpdating = false; // needed since we have multiple MachineTranslationRating components on one page

    $: updateMachineTranslation(machineTranslation);

    async function updateMachineTranslation(data: MachineTranslation) {
        if (skipFirstPatch) {
            skipFirstPatch = false;
            return;
        }

        if (!currentComponentUpdating) {
            return;
        }

        machineTranslationStore.debounce(async () => {
            await patchToApi(`/resources/content/machine-translation/${machineTranslation.id}`, { ...data });
        });
        machineTranslationStore.machineTranslations.update((machineTranslations) =>
            machineTranslations.set(itemIndex, data)
        );
        currentComponentUpdating = false;
    }

    const onRating = async (e: MouseEvent, newRating: number) => {
        e.stopPropagation();

        currentComponentUpdating = true;
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

    function indicateCurrentComponentUpdating() {
        currentComponentUpdating = true;
    }
</script>

<svelte:window on:click={onAnyClick} />

{#if showingInPrompt}
    <StarRating callback={onRating} bind:rating={machineTranslation.userRating} />
{:else}
    <div class="tooltip tooltip-primary" data-tip="Rate AI translation">
        <StarRating callback={onRating} bind:rating={machineTranslation.userRating} />
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
                on:change={indicateCurrentComponentUpdating}
                bind:checked={machineTranslation.improveClarity}
                aria-label="Clarity"
                class="btn btn-outline btn-primary btn-sm"
            />
            <input
                type="checkbox"
                on:change={indicateCurrentComponentUpdating}
                bind:checked={machineTranslation.improveTone}
                aria-label="Tone/Style"
                class="btn btn-outline btn-primary btn-sm"
            />
            <input
                type="checkbox"
                on:change={indicateCurrentComponentUpdating}
                bind:checked={machineTranslation.improveConsistency}
                aria-label="Consistency"
                class="btn btn-outline btn-primary btn-sm"
            />
        </div>
    </div>
{/if}
