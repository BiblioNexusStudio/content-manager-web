<script lang="ts">
    import ProjectOverview from './ProjectOverview.svelte';
    import ProjectQuote from './ProjectQuote.svelte';
    import ProjectDelivery from './ProjectDelivery.svelte';
    import ProjectProgressBar from '../ProjectProgressBar.svelte';

    // todo: add enum
    let tabs = [
        { name: 'Overview', href: '#', current: true },
        { name: 'Quote', href: '#', current: false },
        { name: 'Delivery', href: '#', current: false },
    ];

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

<div class="mb-4 flex ps-4">
    {#each tabs as tab, index}
        <a
            href={tab.href}
            class="me-4 py-2 text-lg {tab.current ? 'border-b-4 border-primary' : ''}"
            on:click={() => setCurrentTab(index)}
        >
            {tab.name}
        </a>
    {/each}
</div>
<div class="flex">
    {#if currentTab.name === 'Overview'}
        <ProjectOverview />
    {:else if currentTab.name === 'Quote'}
        <ProjectQuote />
    {:else if currentTab.name === 'Delivery'}
        <ProjectDelivery />
    {/if}
</div>
<div class="mb-8 w-1/2 pe-8">
    <ProjectProgressBar inProgressCount={100} inReviewCount={50} completeCount={25} showLegend={true} />
</div>
