<script lang="ts">
    import { ProjectStatusTab } from '$lib/types/projects';
    import { Permission, userCan } from '$lib/stores/auth';

    export let activeCount;
    export let recentlyFinishedCount;
    export let notStartedCount;
    export let currentTab: ProjectStatusTab;

    let tabs = $userCan(Permission.ReadProjects)
        ? [
              { name: 'Active', current: true, count: activeCount, value: ProjectStatusTab.active },
              {
                  name: 'Recently Finished',
                  current: false,
                  count: recentlyFinishedCount,
                  value: ProjectStatusTab.recentlyFinished,
              },
              { name: 'Not Started', current: false, count: notStartedCount, value: ProjectStatusTab.notStarted },
          ]
        : [
              { name: 'Active', current: true, count: activeCount, value: ProjectStatusTab.active },
              {
                  name: 'Recently Finished',
                  current: false,
                  count: recentlyFinishedCount,
                  value: ProjectStatusTab.recentlyFinished,
              },
          ];
    $: currentTab = tabs.find((tab) => tab.current)!.value;

    function setCurrentTab(index: number) {
        tabs = tabs.map((tab, i) => {
            return {
                ...tab,
                current: i === index,
            };
        });
    }
</script>

<div role="tablist" class="tabs tabs-bordered w-fit">
    {#each tabs as tab, index (tab.name)}
        <button
            data-app-insights-event-name="projects-{tab.name}-tab-click"
            role="tab"
            class="tab {tab.current ? 'tab-active' : ''}"
            on:click={() => setCurrentTab(index)}
        >
            {tab.name} ({tab.count})
        </button>
    {/each}
</div>
