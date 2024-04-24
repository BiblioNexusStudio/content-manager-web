<script lang="ts">
    import { Permission, userCanOnly } from '$lib/stores/auth';
    import type { PageData } from './$types';
    import EditorDashboard from './EditorDashboard.svelte';
    import ManagerDashboard from './ManagerDashboard.svelte';
    import PublisherDashboard from './PublisherDashboard.svelte';

    export let data: PageData;
</script>

{#if data.publisherDashboard}
    <PublisherDashboard {data} />
{:else if data.editorDashboard}
    <EditorDashboard {data} />
{:else if data.managerDashboard}
    <ManagerDashboard {data} />
{:else if $userCanOnly(Permission.ReadReports)}
    {(window.location.href = '/reporting')}
{:else}
    You don't have permission to see this page.
{/if}
