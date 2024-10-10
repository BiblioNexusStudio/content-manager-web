<script lang="ts">
    import StarIcon from '$lib/icons/StarIcon.svelte';
    import StarFilledIcon from '$lib/icons/StarFilledIcon.svelte';

    export let rating = 0;
    export let callback: (e: MouseEvent, rating: number) => void;

    let starHighlightPosition = rating - 1;

    // this is needed for if the component exists in multiple spots on the page (as the case with MachineTranslationRating.svelte)
    $: refreshStarPosition(rating);
    function refreshStarPosition(r: number) {
        starHighlightPosition = r - 1;
    }

    const onClick = (e: MouseEvent, newRating: number) => {
        callback(e, newRating);
    };
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div class="flex text-primary">
    {#each { length: 5 } as _, i (i)}
        <button
            class="px-1"
            on:click={(e) => onClick(e, i + 1)}
            on:mouseover={() => (starHighlightPosition = i)}
            on:mouseleave={() => (starHighlightPosition = rating - 1)}
        >
            {#if starHighlightPosition >= i}
                <StarFilledIcon />
            {:else}
                <StarIcon />
            {/if}
        </button>
    {/each}
</div>
