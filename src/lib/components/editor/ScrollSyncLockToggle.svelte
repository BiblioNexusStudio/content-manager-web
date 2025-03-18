<script>
    import LockClosedIcon from '$lib/icons/LockClosedIcon.svelte';
    import LockOpenIcon from '$lib/icons/LockOpenIcon.svelte';
    import { scrollSync } from '$lib/stores/scrollSync.svelte.ts';
    import Tooltip from '../Tooltip.svelte';

    let tooltipStr = $derived(scrollSync.isEnabled() ? 'Disable' : 'Enable');
</script>

<Tooltip
    position={{ right: '2rem', top: '0.25rem' }}
    class="border-primary text-primary flex align-middle"
    text="{tooltipStr} Scroll Lock"
>
    <button onclick={scrollSync.toggle} class="btn mt-1 h-auto min-h-0 p-1" class:btn-primary={scrollSync.isEnabled()}>
        {#if scrollSync.isEnabled()}
            <LockClosedIcon />
        {:else}
            <LockOpenIcon />
        {/if}
    </button>
</Tooltip>
