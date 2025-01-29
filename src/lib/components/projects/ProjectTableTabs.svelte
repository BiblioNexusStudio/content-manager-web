<script lang="ts">
    import { ProjectStatusTab } from '$lib/types/projects';
    import { Permission, userCan } from '$lib/stores/auth';

    interface Props {
        activeCount: number;
        recentlyFinishedCount: number;
        notStartedCount: number;
        currentTab: ProjectStatusTab;
    }

    let { activeCount, recentlyFinishedCount, notStartedCount, currentTab = $bindable() }: Props = $props();

    let tabs = $userCan(Permission.ReadProjects)
        ? [
              { name: 'Active', count: activeCount, value: ProjectStatusTab.active },
              {
                  name: 'Recently Finished',
                  count: recentlyFinishedCount,
                  value: ProjectStatusTab.recentlyFinished,
              },
              { name: 'Not Started', count: notStartedCount, value: ProjectStatusTab.notStarted },
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
            onclick={() => (currentTab = tab.value)}
        >
            {tab.name}
            {#if tab.count !== null}
                ({tab.count})
            {/if}
        </button>
    {/each}
</div>
