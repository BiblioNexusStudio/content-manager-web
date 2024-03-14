<script lang="ts">
    import Image from './content-components/Image.svelte';
    import Video from './content-components/Video.svelte';
    import Text from './content-components/Text.svelte';
    import {
        MediaTypeEnum,
        type ImageContentItem,
        type ResourceContent,
        type TiptapContentItem,
        type VideoContentItem,
    } from '$lib/types/resources';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';

    export let editableContentStore: ChangeTrackingStore<TiptapContentItem[]>;
    export let resourceContent: ResourceContent;
    export let canEdit: boolean;
    export let wordCountsByStep: number[];

    $: imageContent = resourceContent.content as ImageContentItem;
    $: videoContent = resourceContent.content as VideoContentItem;
</script>

<div class="flex h-full flex-col overflow-y-hidden rounded-lg border border-base-300 bg-base-200">
    <div class="px-4 py-2 text-xl font-medium">Content</div>
    <div class="h-full rounded-lg bg-white p-4">
        {#if resourceContent.mediaType === MediaTypeEnum.image}
            <Image content={imageContent} />
        {:else if resourceContent.mediaType === MediaTypeEnum.video}
            <Video content={videoContent} />
        {:else if resourceContent.mediaType === MediaTypeEnum.text}
            <Text {resourceContent} bind:wordCountsByStep {editableContentStore} {canEdit} />
        {/if}
    </div>
</div>
