<script lang="ts">
    import { ProjectStatusTab } from '$lib/types/projects';
    import { Permission, userCan } from '$lib/stores/auth';

    export let activeCount;
    export let recentlyFinishedCount;
    export let awaitingAiDraftCount;
    export let currentTab: ProjectStatusTab;

    let tabs = $userCan(Permission.ReadProjects)
        ? [
              { name: 'Active', count: activeCount, value: ProjectStatusTab.active },
              {
                  name: 'Recently Finished',
                  count: recentlyFinishedCount,
                  value: ProjectStatusTab.recentlyFinished,
              },
              { name: 'Not Started', count: awaitingAiDraftCount, value: ProjectStatusTab.notStarted },
              { name: 'Reporting', count: null, value: ProjectStatusTab.reporting },
          ]
        : [
              { name: 'Active', count: activeCount, value: ProjectStatusTab.active },
              {
                  name: 'Recently Finished',
                  count: recentlyFinishedCount,
                  value: ProjectStatusTab.recentlyFinished,
              },
          ];
</script>

<div role="tablist" class="tabs tabs-bordered w-fit">
    {#each tabs as tab (tab.value)}
        <button
            data-app-insights-event-name="projects-{tab.name}-tab-click"
            role="tab"
            class="tab {tab.value === currentTab ? 'tab-active' : ''}"
            on:click={() => (currentTab = tab.value)}
        >
            {tab.name}
            {#if tab.count !== null}
                ({tab.count})
            {/if}
        </button>
    {/each}
</div>
