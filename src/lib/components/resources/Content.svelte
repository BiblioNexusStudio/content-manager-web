<script lang="ts">
    import Accordion from './Accordion.svelte';
    import type { ResourceItem } from '$lib/types/resources';
    import Tiptap from '$lib/Tiptap.svelte';

    $: ({ typeText, currentLanguageResourses } = $$props);
</script>

<Accordion title="Content" closable={false} fullHeight={true}>
    {#if typeText === 'Translation Guide (SRV)'}
        <Tiptap htmlDefault={currentLanguageResourses[1]?.content[0]?.tiptap} />
    {:else if typeText === 'Images (UBS)'}
        <div>image</div>
    {:else if typeText === 'Videos (Video Bible Dictionary)'}
        <div>video</div>
    {:else}
        <div>text</div>
    {/if}
</Accordion>
