<script lang="ts">
    import type { PageData } from './$types';
    import EditorDashboard from './EditorDashboard.svelte';
    import CommunityReviewerDashboard from './CommunityReviewerDashboard.svelte';
    import ManagerDashboard from './ManagerDashboard.svelte';
    import PublisherDashboard from './PublisherDashboard.svelte';

    export let data: PageData;
</script>

{#if data.publisherDashboard}
    <PublisherDashboard {data} />
{:else if data.editorDashboard}
    <EditorDashboard {data} />
{:else if data.communityReviewerDashboard}
    <CommunityReviewerDashboard {data} />
{:else if data.managerDashboard}
    <ManagerDashboard {data} />
{:else}
    You don't have permission to see this page.
{/if}
