<script>
    import LockClosedIcon from '$lib/icons/LockClosedIcon.svelte';
    import LockOpenIcon from '$lib/icons/LockOpenIcon.svelte';
    import { isScrollSyncEnabled } from '$lib/stores/scrollSync';
</script>

<button
    on:click={() => ($isScrollSyncEnabled = !$isScrollSyncEnabled)}
    class="btn h-auto min-h-0 p-1"
    class:btn-primary={$isScrollSyncEnabled}
>
    {#if $isScrollSyncEnabled}
        <LockClosedIcon />
    {:else}
        <LockOpenIcon />
    {/if}
</button>
