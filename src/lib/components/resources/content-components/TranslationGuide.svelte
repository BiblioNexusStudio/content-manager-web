<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import arrowCircleLeft from 'svelte-awesome/icons/arrowCircleLeft';
    import arrowCircleRight from 'svelte-awesome/icons/arrowCircleRight';

    import Tiptap from '$lib/Tiptap.svelte';
    import { filteredResourcesByLanguage } from '$lib/store/resources';

    let currentStepNumber = 1;

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

    $: textResource = $filteredResourcesByLanguage.find((resource) => resource.mediaType.toLowerCase() === 'text');
    $: currentResourceStepsLenght = textResource?.content.length;

    function handleStep(direction: 'forward' | 'backward') {
        if (currentStepNumber === 1 && direction === 'backward') {
            return;
        }

        if (currentStepNumber === currentResourceStepsLenght && direction === 'forward') {
            return;
        }

        if (direction === 'forward') {
            currentStepNumber = currentStepNumber + 1;
        } else {
            currentStepNumber = currentStepNumber - 1;
        }
    }
</script>

<div>
    <div class="flex items-center justify-between px-4">
        <button on:click={() => handleStep('backward')}>
            <Icon data={arrowCircleLeft} scale={3} />
        </button>
        <h2 class="text-xl font-bold">{headings[currentStepNumber - 1]?.heading}</h2>
        <button on:click={() => handleStep('forward')}>
            <Icon data={arrowCircleRight} scale={3} />
        </button>
    </div>
    <Tiptap htmlDefault={textResource?.content[currentStepNumber - 1]?.tiptap} />
</div>
