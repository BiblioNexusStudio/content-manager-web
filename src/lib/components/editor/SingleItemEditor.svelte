<script lang="ts">
    import EditorToolbar from './EditorToolbar.svelte';
    import type { ResourceContent, TiptapContentItem } from '$lib/types/resources';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';
    import TiptapRenderer from './TiptapRenderer.svelte';
    import type { Editor } from 'aquifer-tiptap';
    import type { CommentStores } from '$lib/stores/comments';
    import type { MachineTranslationStore } from '$lib/stores/machineTranslation';
    import { getIsPageTransactingContext } from '$lib/context/is-page-transacting-context';

    interface Props {
        itemIndex: number;
        editableContentStore: ChangeTrackingStore<TiptapContentItem[]>;
        wordCountsByStep: number[];
        characterCountsByStep: number[];
        canEdit: boolean;
        canComment: boolean;
        resourceContent: ResourceContent;
        commentStores: CommentStores;
        machineTranslationStore: MachineTranslationStore;
        blurOnPendingAiTranslate?: boolean;
        isSourceContentArea?: boolean;
    }

    let {
        itemIndex,
        editableContentStore,
        wordCountsByStep = $bindable(),
        characterCountsByStep = $bindable(),
        canEdit,
        canComment,
        resourceContent,
        commentStores,
        machineTranslationStore,
        blurOnPendingAiTranslate = false,
        isSourceContentArea = false,
    }: Props = $props();

    let editor: Editor | undefined = $state(undefined);
    let tiptapJson = $editableContentStore[itemIndex];
    let isLoading = $state(false);

    const isPageTransacting = getIsPageTransactingContext();

    function onChange(tiptapJson: object, wordCount: number, charCount: number) {
        editableContentStore.update((contents) => {
            if (contents[itemIndex]) {
                contents[itemIndex]!.tiptap = tiptapJson;
            }
            return contents;
        });
        wordCountsByStep[itemIndex] = wordCount;
        characterCountsByStep[itemIndex] = charCount;
    }

    function onCreate(tiptapJson: object, wordCount: number, charCount: number) {
        editableContentStore.updateOriginalAndCurrent((contents) => {
            if (contents[itemIndex]) {
                contents[itemIndex]!.tiptap = tiptapJson;
            }
            return contents;
        });
        wordCountsByStep[itemIndex] = wordCount;
        characterCountsByStep[itemIndex] = charCount;
    }
</script>

<div class="flex h-full flex-col space-y-4">
    <EditorToolbar
        {editor}
        {canEdit}
        {commentStores}
        {resourceContent}
        {machineTranslationStore}
        {itemIndex}
        bind:isLoading
    />

    <TiptapRenderer
        language={resourceContent.language}
        {tiptapJson}
        canEdit={canEdit && !$isPageTransacting}
        {canComment}
        {onChange}
        {onCreate}
        {commentStores}
        bind:isLoading
        bind:editor
        {blurOnPendingAiTranslate}
        {isSourceContentArea}
    />
</div>
