<script lang="ts">
    import StarRating from '$lib/components/StarRating.svelte';
    import { patchToApi } from '$lib/utils/http-service';
    import type { MachineTranslation } from '$lib/types/resources';
    import { getMachineTranslationContext, type MachineTranslationStore } from '$lib/stores/machineTranslation';
    import { untrack } from 'svelte';

    interface MachineTranslationRatingProps {
        itemIndex?: number | null;
        showingInPrompt?: boolean;
        improvementHorizontalPositionPx?: number;
    }

    let {
        itemIndex = null,
        showingInPrompt = false,
        improvementHorizontalPositionPx = 60,
    }: MachineTranslationRatingProps = $props();

    let machineTranslationStore: MachineTranslationStore = getMachineTranslationContext();
    let store = machineTranslationStore.machineTranslations;

    let machineTranslation: MachineTranslation = $state({
        id: 0,
        contentIndex: 0,
        userId: 0,
        userRating: 0,
        improveClarity: false,
        improveConsistency: false,
        improveTone: false,
    });
    let translationsMissingRatings: MachineTranslation[] | null = $state(null);

    function syncMachineTranslationFromStore(store: Map<number, MachineTranslation>) {
        if (itemIndex !== null) {
            const storedMachineTranslation = store.get(itemIndex);
            if (storedMachineTranslation) {
                machineTranslation = storedMachineTranslation;
            }
        }
    }

    let promptForRating = machineTranslationStore.promptForRating;
    let showImprovements = $state(false);
    let showImprovementsDiv: HTMLDivElement | undefined = $state();
    let ratedFromPrompt = false;

    // if promptForRating is set we'll need to recalculate translationsMissingRatings
    $effect(() => {
        promptForRating && untrack(() => (translationsMissingRatings = null));
    });

    $effect(() => {
        syncMachineTranslationFromStore($store);
    });

    function updateMachineTranslation() {
        if (showingInPrompt) {
            translationsMissingRatings ||= [...$store.values()].filter((mt) => !mt.userRating);
            machineTranslationStore.debounce(async () => {
                if ((machineTranslation.userRating ?? 0) > 0) {
                    await Promise.all(
                        translationsMissingRatings!.map((mt) =>
                            patchToApi(`/resources/content/machine-translation/${mt.id}`, { ...machineTranslation })
                        )
                    );
                }
            });
            machineTranslationStore.machineTranslations.update((machineTranslations) => {
                for (const translation of translationsMissingRatings!) {
                    machineTranslations.set(
                        translation.contentIndex,
                        mergeDataIntoMachineTranslation(machineTranslation, translation)
                    );
                }
                return machineTranslations;
            });
        } else {
            machineTranslationStore.debounce(async () => {
                if ((machineTranslation.userRating ?? 0) > 0) {
                    await patchToApi(`/resources/content/machine-translation/${machineTranslation.id}`, {
                        ...machineTranslation,
                    });
                }
            });
            machineTranslationStore.machineTranslations.update((machineTranslations) =>
                machineTranslations.set(
                    itemIndex!,
                    mergeDataIntoMachineTranslation(machineTranslation, machineTranslations.get(itemIndex!)!)
                )
            );
        }
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

    const onRating = (e: MouseEvent, newRating: number) => {
        e.stopPropagation();

        if (machineTranslation.userRating !== newRating) {
            machineTranslation.userRating = newRating;
            updateMachineTranslation();
        }

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
</script>

<svelte:window onclick={onAnyClick} />

{#if showingInPrompt}
    <StarRating callback={onRating} rating={machineTranslation.userRating} />
{:else}
    <div class="tooltip tooltip-primary" data-tip="Rate AI translation">
        <StarRating callback={onRating} rating={machineTranslation.userRating} />
    </div>
{/if}

{#if showImprovements}
    <div
        bind:this={showImprovementsDiv}
        class="absolute z-50 -ms-[{improvementHorizontalPositionPx}px] mt-6 h-32 w-64 rounded-sm border bg-white p-2"
    >
        <div>What needed improvement?</div>
        <div class="mt-2 flex flex-wrap gap-2">
            <input
                type="checkbox"
                bind:checked={machineTranslation.improveClarity}
                onchange={updateMachineTranslation}
                aria-label="Clarity"
                class="btn btn-outline btn-primary btn-sm"
            />
            <input
                type="checkbox"
                bind:checked={machineTranslation.improveTone}
                onchange={updateMachineTranslation}
                aria-label="Tone/Style"
                class="btn btn-outline btn-primary btn-sm"
            />
            <input
                type="checkbox"
                bind:checked={machineTranslation.improveConsistency}
                onchange={updateMachineTranslation}
                aria-label="Consistency"
                class="btn btn-outline btn-primary btn-sm"
            />
        </div>
    </div>
{/if}
