<script lang="ts">
    import Image from './content-components/Image.svelte';
    import Video from './content-components/Video.svelte';
    import Text from './content-components/Text.svelte';
    import {
        MediaTypeEnum,
        type ImageContentItem,
        type ResourceContentVersion,
        type TiptapContentItem,
        type VideoContentItem,
    } from '$lib/types/resources';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';

    export let visible: boolean;
    export let editableContentStore: ChangeTrackingStore<TiptapContentItem[]>;
    export let mediaType: MediaTypeEnum;
    export let resourceContentVersion: ResourceContentVersion;
    export let canEdit: boolean;
    export let wordCountsByStep: number[];

    $: imageContent = resourceContentVersion.content as ImageContentItem;
    $: videoContent = resourceContentVersion.content as VideoContentItem;
</script>

<div class="relative flex h-full grow flex-col rounded-lg border border-base-300 bg-base-200 {!visible && 'hidden'}">
    <div class="px-4 py-2 text-xl font-medium">Content</div>
    <div class="h-full overflow-y-scroll rounded-lg bg-white p-4">
        {#if mediaType === MediaTypeEnum.image}
            <Image content={imageContent} />
        {:else if mediaType === MediaTypeEnum.video}
            <Video content={videoContent} />
        {:else if mediaType === MediaTypeEnum.text}
            <Text {resourceContentVersion} bind:wordCountsByStep {editableContentStore} {canEdit} />
        {/if}
    </div>
</div>
