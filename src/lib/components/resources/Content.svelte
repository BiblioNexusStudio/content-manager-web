<script lang="ts">
    import Image from './content-components/Image.svelte';
    import Video from './content-components/Video.svelte';
    import TiptapContent from './content-components/TiptapContent.svelte';
    import { ResourceTypeEnum, type ResourceContent } from '$lib/types/resources';

    export let typeText: string;
    export let resourceContent: ResourceContent;
    export let canEdit: boolean;
</script>

<div class="relative flex h-full grow flex-col rounded-lg border border-base-300 bg-base-200">
    <div class="px-4 py-2 text-xl font-medium">Content</div>
    <div class="h-full overflow-y-scroll rounded-lg bg-white p-4">
        {#if typeText === ResourceTypeEnum.cbbterTranslationGuide}
            <TiptapContent {canEdit} {resourceContent} stepNavigation={true} />
        {:else if typeText === ResourceTypeEnum.tyndaleBibleDictionary}
            <TiptapContent {canEdit} {resourceContent} />
        {:else if typeText === ResourceTypeEnum.tyndaleStudyNotes}
            <TiptapContent {canEdit} {resourceContent} />
        {:else if typeText === ResourceTypeEnum.ubsImages}
            <Image content={resourceContent.content} />
        {:else if typeText === ResourceTypeEnum.videoBibleDictionary}
            <Video content={resourceContent.content} />
        {/if}
    </div>
</div>
