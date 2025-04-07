<script lang="ts">
    import Image from './content-components/Image.svelte';
    import Video from './content-components/Video.svelte';
    import Text from './content-components/Text.svelte';
    import Audio from './content-components/Audio.svelte';
    import {
        MediaTypeEnum,
        type ImageContentItem,
        type ResourceContent,
        type TiptapContentItem,
        type VideoContentItem,
        type Snapshot,
        type Version,
    } from '$lib/types/resources';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';
    import type { CommentStores } from '$lib/stores/comments';

    interface ContentProps {
        editableContentStore: ChangeTrackingStore<TiptapContentItem[]>;
        resourceContent: ResourceContent;
        canEdit?: boolean;
        canComment?: boolean;
        wordCountsByStep?: number[] | undefined;
        characterCountsByStep?: number[];
        snapshotOrVersion?: Snapshot | Version | undefined;
        selectedStepNumber: number | undefined;
        sidebarIsOpen?: boolean;
        commentStores: CommentStores;
        blurOnPendingAiTranslate?: boolean;
        isSourceContentArea?: boolean;
    }

    let {
        editableContentStore,
        resourceContent,
        canEdit = false,
        canComment = false,
        wordCountsByStep = $bindable(undefined),
        characterCountsByStep = $bindable([]),
        snapshotOrVersion = undefined,
        selectedStepNumber = $bindable(),
        sidebarIsOpen = false,
        commentStores,
        blurOnPendingAiTranslate = false,
        isSourceContentArea = false,
    }: ContentProps = $props();

    let imageContent = $derived((snapshotOrVersion?.content ?? resourceContent.content) as ImageContentItem);
    let videoContent = $derived((snapshotOrVersion?.content ?? resourceContent.content) as VideoContentItem);
</script>

{#if resourceContent.mediaType === MediaTypeEnum.image}
    <Image content={imageContent} />
{:else if resourceContent.mediaType === MediaTypeEnum.video}
    <Video content={videoContent} />
{:else if resourceContent.mediaType === MediaTypeEnum.audio}
    <Audio {resourceContent} />
{:else if resourceContent.mediaType === MediaTypeEnum.text}
    <Text
        {sidebarIsOpen}
        bind:selectedStepNumber
        {snapshotOrVersion}
        {resourceContent}
        bind:wordCountsByStep
        bind:characterCountsByStep
        {editableContentStore}
        {canEdit}
        {canComment}
        {commentStores}
        {blurOnPendingAiTranslate}
        {isSourceContentArea}
    />
{/if}
