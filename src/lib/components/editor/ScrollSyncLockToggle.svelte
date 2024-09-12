<script>
    import LockClosedIcon from '$lib/icons/LockClosedIcon.svelte';
    import LockOpenIcon from '$lib/icons/LockOpenIcon.svelte';
    import { isScrollSyncEnabled } from '$lib/stores/scrollSync';
    import Tooltip from '../Tooltip.svelte';

    $: tooltipStr = $isScrollSyncEnabled ? 'Disable' : 'Enable';
</script>

<Tooltip
    position={{ right: '2rem', top: '0.25rem' }}
    class="flex border-primary align-middle text-primary"
    text="{tooltipStr} Scroll Lock"
>
    <button
        on:click={() => ($isScrollSyncEnabled = !$isScrollSyncEnabled)}
        class="btn mt-1 h-auto min-h-0 p-1"
        class:btn-primary={$isScrollSyncEnabled}
    >
        {#if $isScrollSyncEnabled}
            <LockClosedIcon />
        {:else}
            <LockOpenIcon />
        {/if}
    </button>
</Tooltip>
