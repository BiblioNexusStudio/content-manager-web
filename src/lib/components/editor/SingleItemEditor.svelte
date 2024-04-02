<script lang="ts">
    import EditorToolbar from './EditorToolbar.svelte';
    import type { ResourceContent, TiptapContentItem } from '$lib/types/resources';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';
    import TiptapRenderer from './TiptapRenderer.svelte';
    import type { Editor } from '@tiptap/core';
    import type { CommentStores } from '$lib/stores/comments';

    export let itemIndex: number;
    export let editableContentStore: ChangeTrackingStore<TiptapContentItem[]>;
    export let wordCountsByStep: number[];
    export let canEdit: boolean;
    export let canComment: boolean;
    export let canAiTranslate: boolean;
    export let resourceContent: ResourceContent;
    export let commentStores: CommentStores;

    let editor: Editor | undefined = undefined;
    let tiptapJson = $editableContentStore[itemIndex];
    let isLoading: boolean;

    function onChange(tiptapJson: object, wordCount: number) {
        editableContentStore.update((contents) => {
            if (contents[itemIndex]) {
                contents[itemIndex]!.tiptap = tiptapJson;
            }
            return contents;
        });
        wordCountsByStep[itemIndex] = wordCount;
    }

    function onCreate(tiptapJson: object, wordCount: number) {
        editableContentStore.updateOriginalAndCurrent((contents) => {
            if (contents[itemIndex]) {
                contents[itemIndex]!.tiptap = tiptapJson;
            }
            return contents;
        });
        wordCountsByStep[itemIndex] = wordCount;
    }
</script>

<div class="flex h-full flex-col space-y-4">
    <EditorToolbar {editor} {canEdit} {canAiTranslate} {commentStores} {resourceContent} bind:isLoading />

    <TiptapRenderer
        {tiptapJson}
        {canEdit}
        {canComment}
        {onChange}
        {onCreate}
        {commentStores}
        bind:isLoading
        bind:editor
    />
</div>
