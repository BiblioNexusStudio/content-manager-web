<script lang="ts">
    import type { TiptapContentItem } from '$lib/types/resources';
    import TiptapRenderer from './TiptapRenderer.svelte';
    import type { CommentStores } from '$lib/stores/comments';
    import type { Language } from '$lib/types/base';

    export let language: Language;
    export let wordCountsByStep: number[] = [];
    export let characterCountsByStep: number[] = [];
    export let itemIndex: number;
    export let canEdit: boolean;
    export let canComment: boolean;
    export let commentStores: CommentStores;
    export let tiptapJson: TiptapContentItem | undefined;
    export let isSourceContentArea = false;

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
