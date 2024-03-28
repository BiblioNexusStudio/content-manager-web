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
    import type { CommentStores } from '$lib/stores/comments';

    export let editableContentStore: ChangeTrackingStore<TiptapContentItem[]>;
    export let resourceContent: ResourceContent;
    export let canEdit = false;
    export let canComment = false;
    export let wordCountsByStep: number[] | undefined = undefined;
    export let snapshot: Snapshot | undefined = undefined;
    export let selectedStepNumber: number | undefined;
    export let isComparingToCurrent = false;
    export let commentStores: CommentStores;

    $: imageContent = (snapshot?.content ?? resourceContent.content) as ImageContentItem;
    $: videoContent = (snapshot?.content ?? resourceContent.content) as VideoContentItem;
</script>

{#if resourceContent.mediaType === MediaTypeEnum.image}
    <Image content={imageContent} />
{:else if resourceContent.mediaType === MediaTypeEnum.video}
    <Video content={videoContent} />
{:else if resourceContent.mediaType === MediaTypeEnum.text}
    <Text
        {isComparingToCurrent}
        bind:selectedStepNumber
        {snapshot}
        {resourceContent}
        bind:wordCountsByStep
        {editableContentStore}
        {canEdit}
        {canComment}
        {commentStores}
    />
{/if}
