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
        type Snapshot,
    } from '$lib/types/resources';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';

    export let editableContentStore: ChangeTrackingStore<TiptapContentItem[]> | undefined = undefined;
    export let resourceContent: ResourceContent;
    export let canEdit: boolean;
    export let wordCountsByStep: number[] | undefined = undefined;
    export let snapshot: Snapshot | undefined = undefined;
    export let selectedStepNumber: number | undefined;

    $: imageContent = (snapshot?.content ?? resourceContent.content) as ImageContentItem;
    $: videoContent = (snapshot?.content ?? resourceContent.content) as VideoContentItem;
</script>

{#if resourceContent.mediaType === MediaTypeEnum.image}
    <Image content={imageContent} />
{:else if resourceContent.mediaType === MediaTypeEnum.video}
    <Video content={videoContent} />
{:else if resourceContent.mediaType === MediaTypeEnum.text}
    <Text bind:selectedStepNumber {snapshot} {resourceContent} bind:wordCountsByStep {editableContentStore} {canEdit} />
{/if}
