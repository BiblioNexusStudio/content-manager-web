<script lang="ts">
    import Accordion from './Accordion.svelte';
    import Image from './content-components/Image.svelte';
    import Video from './content-components/Video.svelte';
    import TiptapContent from './content-components/TiptapContent.svelte';
    import { ResourceTypeEnum, type ResourceContent } from '$lib/types/resources';

    export let typeText: string;
    export let resourceContent: ResourceContent;
</script>

<Accordion title="Content" closable={false} fullHeight={true}>
    {#if typeText === ResourceTypeEnum.cbbterTranslationGuide}
        <TiptapContent {resourceContent} stepNavigation={true} />
    {:else if typeText === ResourceTypeEnum.tyndaleBibleDictionary}
        <TiptapContent {resourceContent} />
    {:else if typeText === ResourceTypeEnum.tyndaleStudyNotes}
        <TiptapContent {resourceContent} />
    {:else if typeText === ResourceTypeEnum.ubsImages}
        <Image content={resourceContent.content} />
    {:else if typeText === ResourceTypeEnum.videoBibleDictionary}
        <Video content={resourceContent.content} />
    {/if}
</Accordion>
