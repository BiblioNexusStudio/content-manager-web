<script lang="ts">
    import { page } from '$app/stores';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';

    /**
     * This component handles error displays triggered by `src/hooks.client.ts` when errors
     * occur within any `+page.ts#load` or `+layout.ts#load`.
     */
</script>

<ErrorMessage uncastError={$page?.error} />
