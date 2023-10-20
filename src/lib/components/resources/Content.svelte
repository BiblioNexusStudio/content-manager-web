<script lang="ts">
    import Accordion from './Accordion.svelte';
    import Image from './content-components/Image.svelte';
    import Video from './content-components/Video.svelte';
    import TiptapContent from './content-components/TiptapContent.svelte';
    import { ResourceTypeEnum } from '$lib/types/resources';

    export let typeText: string;
</script>

<Accordion title="Content" closable={false} fullHeight={true}>
    {#if typeText === ResourceTypeEnum.cbbterTranslationGuide}
        <TiptapContent stepNavigation={true} />
    {:else if typeText === ResourceTypeEnum.tyndaleBibleDictionary}
        <TiptapContent />
    {:else if typeText === ResourceTypeEnum.tyndaleStudyNotes}
        <TiptapContent />
    {:else if typeText === ResourceTypeEnum.ubsImages}
        <Image />
    {:else if typeText === ResourceTypeEnum.videoBibleDictionary}
        <Video />
    {/if}
</Accordion>
