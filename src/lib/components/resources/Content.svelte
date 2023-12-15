<script lang="ts">
    import Image from './content-components/Image.svelte';
    import Video from './content-components/Video.svelte';
    import TiptapContent from './content-components/TiptapContent.svelte';
    import { MediaTypeEnum, type ResourceContent } from '$lib/types/resources';

    export let mediaType: string;
    export let resourceContent: ResourceContent;
    export let canEdit: boolean;
</script>

<div class="relative flex h-full grow flex-col rounded-lg border border-base-300 bg-base-200">
    <div class="px-4 py-2 text-xl font-medium">Content</div>
    <div class="h-full overflow-y-scroll rounded-lg bg-white p-4">
        {#if mediaType === MediaTypeEnum.image}
            <Image content={resourceContent.content} />
        {:else if mediaType === MediaTypeEnum.video}
            <Video content={resourceContent.content} />
        {:else if mediaType === MediaTypeEnum.text}
            <TiptapContent {canEdit} {resourceContent} />
        {/if}
    </div>
</div>
