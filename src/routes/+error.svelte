<script lang="ts">
    import { page } from '$app/stores';
    import ErrorMessage from '$lib/components/ErrorMessage.svelte';
</script>

<ErrorMessage uncastError={$page?.error} />
