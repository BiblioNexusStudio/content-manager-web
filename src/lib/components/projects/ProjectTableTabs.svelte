<script lang="ts">
    import { ProjectStatusTab } from '$lib/types/projects';
    export let canOnlyViewProjectsInCompany: boolean;

    export let activeCount;
    export let recentlyFinishedCount;
    export let notStartedCount;
    export let currentTab: ProjectStatusTab;

    let tabs = !canOnlyViewProjectsInCompany
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

<div class="mt-4 flex ps-2">
    {#each tabs as tab, index (tab.name)}
        <button
            data-app-insights-event-name="projects-{tab.name}-tab-click"
            class="me-4 py-2 text-lg {tab.current ? 'border-b-4 border-primary' : ''}"
            on:click={() => setCurrentTab(index)}
        >
            {tab.name} ({tab.count})
        </button>
    {/each}
</div>
