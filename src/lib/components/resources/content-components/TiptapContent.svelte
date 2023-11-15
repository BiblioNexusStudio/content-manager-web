<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import arrowCircleLeft from 'svelte-awesome/icons/arrowCircleLeft';
    import arrowCircleRight from 'svelte-awesome/icons/arrowCircleRight';
    import Tiptap from '$lib/components/tiptap/Tiptap.svelte';
    import { filteredResourcesByLanguage } from '$lib/stores/resources';
    //import type { ContentItem } from '$lib/types/resources';
    import { setOriginalValues, currentStepNumber, type TiptapContentItemValues } from '$lib/stores/tiptapContent';
    //import type { JSONContent } from '@tiptap/core';

    export let stepNavigation = false;

    $: textResource = $filteredResourcesByLanguage.find((resource) => resource.mediaType.toLowerCase() === 'text');
    //$: contentArray = textResource?.content as ContentItem[];
    // $: tiptapContents = contentArray.map(({ stepNumber, tiptap }) => ({
    //     stepNumber,
    //     tiptap: tiptap as unknown as JSONContent,
    // })) as TiptapContentItemValues[];
    $: tiptapContents = textResource?.content as unknown as TiptapContentItemValues[];
    $: currentResourceStepsLength = tiptapContents.length || 0;
    $: setOriginalValues({ contentId: textResource?.resourceContentId, content: tiptapContents });

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
        if ($currentStepNumber === 1 && direction === 'backward') {
            return;
        }

        if ($currentStepNumber === currentResourceStepsLength && direction === 'forward') {
            return;
        }

        if (direction === 'forward') {
            $currentStepNumber += 1;
        } else {
            $currentStepNumber -= 1;
        }
    }
</script>

<div>
    {#if stepNavigation}
        <div class="flex items-center justify-between px-4">
            {#if $currentStepNumber !== 1}
                <button on:click={() => handleStep('backward')}>
                    <Icon data={arrowCircleLeft} scale={3} />
                </button>
            {/if}

            <h2 class="mx-auto text-xl font-bold">{headings[$currentStepNumber - 1]?.heading}</h2>

            {#if $currentStepNumber !== currentResourceStepsLength}
                <button on:click={() => handleStep('forward')}>
                    <Icon data={arrowCircleRight} scale={3} />
                </button>
            {/if}
        </div>
    {/if}
    <Tiptap />
</div>
