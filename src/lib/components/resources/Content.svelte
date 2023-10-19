<script lang="ts">
    import Accordion from './Accordion.svelte';
    import Image from './content-components/Image.svelte';
    import Video from './content-components/Video.svelte';
    import TranslationGuide from './content-components/TranslationGuide.svelte';

    export let typeText: string;
</script>

<Accordion title="Content" closable={false} fullHeight={true}>
    {#if typeText === 'Translation Guide (SRV)'}
        <TranslationGuide />
    {:else if typeText === 'Images (UBS)'}
        <Image />
    {:else if typeText === 'Videos (Video Bible Dictionary)'}
        <Video />
    {:else}
        <div>text</div>
    {/if}
</Accordion>
