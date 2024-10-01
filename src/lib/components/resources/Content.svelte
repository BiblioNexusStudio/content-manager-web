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
        type Version,
    } from '$lib/types/resources';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';
    import type { CommentStores } from '$lib/stores/comments';
    import type { MachineTranslationStore } from '$lib/stores/machineTranslation';

    export let editableContentStore: ChangeTrackingStore<TiptapContentItem[]>;
    export let editableDisplayNameStore: ChangeTrackingStore<string> | undefined = undefined;
    export let resourceContent: ResourceContent;
    export let canEdit = false;
    export let canComment = false;
    export let wordCountsByStep: number[] | undefined = undefined;
    export let snapshotOrVersion: Snapshot | Version | undefined = undefined;
    export let selectedStepNumber: number | undefined;
    export let sidebarIsOpen = false;
    export let commentStores: CommentStores;
    export let machineTranslationStore: MachineTranslationStore;

    $: imageContent = (snapshotOrVersion?.content ?? resourceContent.content) as ImageContentItem;
    $: videoContent = (snapshotOrVersion?.content ?? resourceContent.content) as VideoContentItem;
</script>

{#if resourceContent.mediaType === MediaTypeEnum.image}
    <Image content={imageContent} />
{:else if resourceContent.mediaType === MediaTypeEnum.video}
    <Video content={videoContent} />
{:else if resourceContent.mediaType === MediaTypeEnum.text}
    <Text
        {sidebarIsOpen}
        bind:selectedStepNumber
        {snapshotOrVersion}
        {resourceContent}
        bind:wordCountsByStep
        {editableDisplayNameStore}
        {editableContentStore}
        {canEdit}
        {canComment}
        {commentStores}
        {machineTranslationStore}
    />
{/if}
