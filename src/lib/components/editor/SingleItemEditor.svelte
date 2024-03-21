<script lang="ts">
    import { type Editor, getMarkAttributes } from '@tiptap/core';
    import EditorToolbar from './EditorToolbar.svelte';
    import type { TiptapContentItem } from '$lib/types/resources';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';
    import { removeCommentMarks } from '$lib/stores/comments';
    import TiptapRenderer from './TiptapRenderer.svelte';
    import { onDestroy, onMount } from 'svelte';

    export let itemIndex: number;
    export let editableContentStore: ChangeTrackingStore<TiptapContentItem[]>;
    export let wordCountsByStep: number[];

    let editor: Editor | undefined = undefined;

    let tiptapJson = $editableContentStore[itemIndex];

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

    onMount(() => {
        $removeCommentMarks = (threadId: number) => {
            if (editor) {
                editor.chain().focus('all').run();
                // editor.state.doc.marks
                // editor.chain().focus().unsetComments().run();
                //
                // getMarkRange(0, 'comments');

                const ma = getMarkAttributes(editor.state, 'comments');
                console.log(ma);
                console.log(threadId);
            }
        };
    });

    onDestroy(() => {
        $removeCommentMarks = () => {
            return;
        };
    });
</script>

<div class="flex h-full flex-col space-y-4">
    <EditorToolbar {editor} />

    <TiptapRenderer {tiptapJson} {onChange} {onCreate} bind:editor />
</div>
