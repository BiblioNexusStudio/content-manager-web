<script lang="ts">
    import type { PageData } from './$types';
    import { Role } from '$lib/stores/auth';
    import EditorDashboard from './EditorDashboard.svelte';
    import PublisherDashboard from './PublisherDashboard.svelte';

    export let data: PageData;
</script>

{#if data.currentUser.is(Role.Editor)}
    <EditorDashboard {data} />
{:else}
    <PublisherDashboard {data} />
{/if}
