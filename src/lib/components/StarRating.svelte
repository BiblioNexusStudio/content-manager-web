<script lang="ts">
    import StarIcon from '$lib/icons/StarIcon.svelte';
    import StarFilledIcon from '$lib/icons/StarFilledIcon.svelte';

    export let rating = 0;
    export let callback: (rating: number) => void;

    let mouseOverPosition = rating - 1;

    const onClick = (newRating: number) => {
        rating = newRating;
        callback(rating);
    };
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div class="tooltip tooltip-primary" data-tip="Rate AI translation">
    <div class="mx-2 flex text-primary">
        {#each { length: 5 } as _, i (i)}
            <button
                class="px-1"
                on:click={() => onClick(i + 1)}
                on:mouseover={() => (mouseOverPosition = i)}
                on:mouseleave={() => (mouseOverPosition = rating - 1)}
            >
                {#if mouseOverPosition >= i}
                    <StarFilledIcon />
                {:else}
                    <StarIcon />
                {/if}
            </button>
        {/each}
    </div>
</div>
