<script lang="ts">
    import StarRating from '$lib/components/StarRating.svelte';
    import { patchToApi } from '$lib/utils/http-service';
    import type { MachineTranslation } from '$lib/types/resources';
    import type { MachineTranslationStore } from '$lib/stores/machineTranslation';

    export let itemIndex: number | null = null;
    export let machineTranslationStore: MachineTranslationStore;
    export let showingInPrompt = false;
    export let improvementHorizontalPositionPx = 60;

    let store = machineTranslationStore.machineTranslations;
    let machineTranslation: MachineTranslation = {
        id: 0,
        contentIndex: 0,
        userId: 0,
        userRating: 0,
        improveClarity: false,
        improveConsistency: false,
        improveTone: false,
    };
    let translationsMissingRatings: MachineTranslation[] | null = null;

    function syncMachineTranslationFromStore(store: Map<number, MachineTranslation>) {
        if (itemIndex !== null) {
            const storedMachineTranslation = store.get(itemIndex);
            if (storedMachineTranslation) {
                machineTranslation = storedMachineTranslation;
            }
        }
    }

    let promptForRating = machineTranslationStore.promptForRating;
    let showImprovements = false;
    let showImprovementsDiv: HTMLDivElement;
    let skipFirstPatch = true; // prevent reactive function from running on load
    let ratedFromPrompt = false;
    let currentComponentUpdating = false; // needed since we have multiple MachineTranslationRating components on one page

    // if promptForRating is set we'll need to recalculate translationsMissingRatings
    $: $promptForRating && (translationsMissingRatings = null);
    $: syncMachineTranslationFromStore($store);
    $: updateMachineTranslation(machineTranslation);

    async function updateMachineTranslation(data: MachineTranslation) {
        if (skipFirstPatch) {
            skipFirstPatch = false;
            return;
        }

        if (!currentComponentUpdating) {
            return;
        }

        if (showingInPrompt) {
            translationsMissingRatings ||= [...$store.values()].filter((mt) => !mt.userRating);
            machineTranslationStore.debounce(async () => {
                await Promise.all(
                    translationsMissingRatings!.map((mt) =>
                        patchToApi(`/resources/content/machine-translation/${mt.id}`, { ...data })
                    )
                );
            });
            machineTranslationStore.machineTranslations.update((machineTranslations) => {
                for (const translation of translationsMissingRatings!) {
                    machineTranslations.set(
                        translation.contentIndex,
                        mergeDataIntoMachineTranslation(data, translation)
                    );
                }
                return machineTranslations;
            });
        } else {
            machineTranslationStore.debounce(async () => {
                await patchToApi(`/resources/content/machine-translation/${machineTranslation.id}`, { ...data });
            });
            machineTranslationStore.machineTranslations.update((machineTranslations) =>
                machineTranslations.set(
                    itemIndex!,
                    mergeDataIntoMachineTranslation(data, machineTranslations.get(itemIndex!)!)
                )
            );
        }
        currentComponentUpdating = false;
    }

    function mergeDataIntoMachineTranslation(data: MachineTranslation, machineTranslation: MachineTranslation) {
        return {
            ...machineTranslation,
            userRating: data.userRating,
            improveClarity: data.improveClarity,
            improveConsistency: data.improveConsistency,
            improveTone: data.improveTone,
        } as MachineTranslation;
    }

    const onRating = async (e: MouseEvent, newRating: number) => {
        e.stopPropagation();

        currentComponentUpdating = true;
        showImprovements = newRating < 5;

        if (showingInPrompt) {
            ratedFromPrompt = true;
        } else {
            $promptForRating = [...$store.values()].some((mt) => !mt.userRating);
        }
    };

    const onAnyClick = (e: MouseEvent) => {
        if (showImprovementsDiv) {
            showImprovements = showImprovementsDiv.contains(e.target as Node);
        } else if (ratedFromPrompt) {
            $promptForRating = [...$store.values()].some((mt) => !mt.userRating);
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
