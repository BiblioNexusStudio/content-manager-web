<script lang="ts">
    import ProjectOverview from './ProjectOverview.svelte';
    import ProjectQuote from './ProjectQuote.svelte';
    import ProjectDelivery from './ProjectDelivery.svelte';
    export let canOnlyViewProjectsInCompany: boolean;

    let tabs = !canOnlyViewProjectsInCompany
        ? [
              { name: 'Overview', current: true },
              { name: 'Quote', current: false },
              { name: 'Delivery', current: false },
          ]
        : [{ name: 'Overview', current: true }];
    $: currentTab = tabs.find((tab) => tab.current)!;

    function setCurrentTab(index: number) {
        tabs = tabs.map((tab, i) => {
            return {
                ...tab,
                current: i === index,
            };
        });
    }
</script>

<div class="mt-4 flex ps-4 xl:mb-2 xl:mt-0 xl:ps-0">
    {#each tabs as tab, index (tab.name)}
        {#if !canOnlyViewProjectsInCompany}
            <button
                data-app-insights-event-name="projects-{tab.name}-tab-click"
                class="me-4 {canOnlyViewProjectsInCompany ? 'hidden' : ''} py-2 text-lg {tab.current
                    ? 'border-b-4 border-primary'
                    : ''}"
                on:click={() => setCurrentTab(index)}
            >
                {tab.name}
            </button>
        {:else}
            <div class="hidden border-b-4 border-primary text-lg xl:flex">{tab.name}</div>
        {/if}
    {/each}
</div>
<div class="flex">
    {#if currentTab.name === 'Overview'}
        <ProjectOverview {canOnlyViewProjectsInCompany} />
    {:else if currentTab.name === 'Quote'}
        <ProjectQuote />
    {:else if currentTab.name === 'Delivery'}
        <ProjectDelivery />
    {/if}
</div>
