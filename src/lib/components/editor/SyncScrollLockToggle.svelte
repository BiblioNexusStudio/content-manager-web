<script>
    import LockClosedIcon from '$lib/icons/LockClosedIcon.svelte';
    import LockOpenIcon from '$lib/icons/LockOpenIcon.svelte';
    import { isSyncScrollEnabled } from '$lib/stores/scrollSync';
</script>

<button
    on:click={() => ($isSyncScrollEnabled = !$isSyncScrollEnabled)}
    class="btn h-auto min-h-0 p-1"
    class:btn-primary={$isSyncScrollEnabled}
>
    {#if $isSyncScrollEnabled}
        <LockClosedIcon />
    {:else}
        <LockOpenIcon />
    {/if}
</button>
