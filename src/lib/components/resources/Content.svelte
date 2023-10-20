<script lang="ts">
    import Accordion from './Accordion.svelte';
    import Image from './content-components/Image.svelte';
    import Video from './content-components/Video.svelte';
    import TiptapContent from './content-components/TiptapContent.svelte';

    export let typeText: string;
</script>

<Accordion title="Content" closable={false} fullHeight={true}>
    {#if typeText === 'Translation Guide (SRV)'}
        <TiptapContent stepNavigation={true} />
    {:else if typeText === 'Bible Dictionary (Tyndale)'}
        <TiptapContent />
    {:else if typeText === 'Study Notes (Tyndale)'}
        <TiptapContent />
    {:else if typeText === 'Images (UBS)'}
        <Image />
    {:else if typeText === 'Videos (Video Bible Dictionary)'}
        <Video />
    {/if}
</Accordion>
