<script lang="ts">
    import Accordion from './Accordion.svelte';
    import TranslationGuide from './contentComponents/TranslationGuide.svelte';

    export let typeText: string;
</script>

<Accordion title="Content" closable={false} fullHeight={true}>
    {#if typeText === 'Translation Guide (SRV)'}
        <TranslationGuide />
    {:else if typeText === 'Images (UBS)'}
        <div>image</div>
    {:else if typeText === 'Videos (Video Bible Dictionary)'}
        <div>video</div>
    {:else}
        <div>text</div>
    {/if}
</Accordion>
