<script lang="ts">
    import type { Editor } from '@tiptap/core';
    import EditorToolbar from './EditorToolbar.svelte';
    import type { TiptapContentItem } from '$lib/types/resources';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';
    import TiptapRenderer from './TiptapRenderer.svelte';

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
</script>

<div class="flex h-full flex-col space-y-4">
    <EditorToolbar {editor} />

    <TiptapRenderer {tiptapJson} {onChange} {onCreate} bind:editor />
</div>
