<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import arrowCircleLeft from 'svelte-awesome/icons/arrowCircleLeft';
    import arrowCircleRight from 'svelte-awesome/icons/arrowCircleRight';
    import Editor from '$lib/components/editor/Editor.svelte';
    import type { ResourceContentVersion, TiptapContentItem } from '$lib/types/resources';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';

    export let editableContentStore: ChangeTrackingStore<TiptapContentItem[]>;
    export let canEdit: boolean;
    export let wordCountsByStep: number[];
    export let resourceContentVersion: ResourceContentVersion;

    let currentStepNumber = 1;

    $: numberOfSteps = $editableContentStore.original.length;
    $: stepNavigation = numberOfSteps > 1;

    const headings = [
        {
            step: 1,
            heading: 'Hear and Heart',
        },
        {
            step: 2,
            heading: 'Setting the Stage',
        },
        {
            step: 3,
            heading: 'Defining the Scenes',
        },
        {
            step: 4,
            heading: 'Embodying the Text',
        },
        {
            step: 5,
            heading: 'Filling the Gaps',
        },
        {
            step: 6,
            heading: 'Speaking the Word',
        },
    ];

    function handleStep(direction: 'forward' | 'backward') {
        if (currentStepNumber === 1 && direction === 'backward') {
            return;
        }

        if (currentStepNumber === numberOfSteps && direction === 'forward') {
            return;
        }

        if (direction === 'forward') {
            currentStepNumber += 1;
        } else {
            currentStepNumber -= 1;
        }
    }
</script>

<div>
    {#if stepNavigation}
        <div class="absolute top-[44px] z-50 w-[calc(100%-2rem)] bg-white pe-12 ps-4">
            <div class="mt-2 flex items-center justify-between">
                {#if currentStepNumber !== 1}
                    <button on:click={() => handleStep('backward')}>
                        <Icon data={arrowCircleLeft} scale={2} />
                    </button>
                {/if}

                <h2 class="mx-auto text-xl font-bold">{headings[currentStepNumber - 1]?.heading}</h2>

                {#if currentStepNumber !== numberOfSteps}
                    <button on:click={() => handleStep('forward')}>
                        <Icon data={arrowCircleRight} scale={2} />
                    </button>
                {/if}
            </div>
        </div>
    {/if}

    <Editor
        {resourceContentVersion}
        bind:wordCountsByStep
        {editableContentStore}
        contentIndex={currentStepNumber - 1}
        {canEdit}
    />
</div>
