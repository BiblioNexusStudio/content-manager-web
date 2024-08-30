<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import CenteredSpinnerFullScreen from '$lib/components/CenteredSpinnerFullScreen.svelte';

    onMount(() => {
        goto('/');
    });
</script>

<CenteredSpinnerFullScreen />
