<script lang="ts">
    import type { TiptapContentItem } from '$lib/types/resources';
    import TiptapRenderer from './TiptapRenderer.svelte';
    import type { CommentStores } from '$lib/stores/comments';
    import type { Language } from '$lib/types/base';

    interface Props {
        language: Language;
        wordCountsByStep?: number[];
        characterCountsByStep?: number[];
        itemIndex: number;
        canEdit: boolean;
        canComment: boolean;
        commentStores: CommentStores;
        tiptapJson: TiptapContentItem | undefined;
        isSourceContentArea?: boolean;
    }

    let {
        language,
        wordCountsByStep = $bindable([]),
        characterCountsByStep = $bindable([]),
        itemIndex,
        canEdit,
        canComment,
        commentStores,
        tiptapJson,
        isSourceContentArea = false,
    }: Props = $props();

    function onChange(tiptapJson: object, wordCount: number, charCount: number) {
        wordCountsByStep[itemIndex] = wordCount;
        characterCountsByStep[itemIndex] = charCount;
    }

    function onCreate(tiptapJson: object, wordCount: number, charCount: number) {
        wordCountsByStep[itemIndex] = wordCount;
        characterCountsByStep[itemIndex] = charCount;
    }
</script>

<div class="flex h-full flex-col space-y-4">
    <TiptapRenderer
        {language}
        {tiptapJson}
        {canEdit}
        {canComment}
        {commentStores}
        {onChange}
        {onCreate}
        {isSourceContentArea}
    />
</div>
