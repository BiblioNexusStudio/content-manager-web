<script>
    import ArrowsLetRight from '$lib/icons/ArrowsLetRight.svelte';
    import Tooltip from '../Tooltip.svelte';
    import { isLeftToRight } from '$lib/stores/resourceEditor';
</script>

<Tooltip
    position={{ right: '2rem', top: '0.25rem' }}
    class="flex border-primary align-middle text-primary"
    text="Swap Editor Panes"
>
    <button on:click={() => ($isLeftToRight = !$isLeftToRight)} class="btn mt-1 h-auto min-h-0 p-1">
        <ArrowsLetRight />
    </button>
</Tooltip>
