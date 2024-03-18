<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor } from '@tiptap/core';
    import Image from '@tiptap/extension-image';
    import Link from '@tiptap/extension-link';
    import Highlight from '@tiptap/extension-highlight';
    import Subscript from '@tiptap/extension-subscript';
    import CharacterCount from '@tiptap/extension-character-count';
    import Superscript from '@tiptap/extension-superscript';
    import TextStyle from '@tiptap/extension-text-style';
    import StarterKit from '@tiptap/starter-kit';
    import Underline from '@tiptap/extension-underline';
    import * as customMarks from '$lib/components/tiptap/customMarks';
    import { commentsMark } from '$lib/components/tiptap/commentsMark';
    import TextDirection from 'tiptap-text-direction';
    import type { TiptapContentItem } from '$lib/types/resources';

    export let tiptapJson: TiptapContentItem | undefined;
    export let onChange: ((tiptapJson: object, wordCount: number) => void) | undefined = undefined;
    export let onCreate: ((tiptapJson: object, wordCount: number) => void) | undefined = undefined;
    export let editor: Editor | undefined = undefined;

    let element: HTMLDivElement | undefined;

    onMount(async () => {
        editor = new Editor({
            element,
            editable: !!onChange,
            extensions: [
                StarterKit,
                Image,
                Link.configure({
                    openOnClick: false,
                }),
                Underline,
                Highlight,
                Subscript,
                Superscript,
                TextStyle,
                CharacterCount.configure({}),
                commentsMark,
                customMarks.bibleReferenceMark,
                customMarks.resourceReferenceMark,
                TextDirection.configure({
                    types: ['heading', 'paragraph', 'orderedList', 'bulletList', 'listItem'],
                }),
            ],
            editorProps: {
                attributes: {
                    class: 'prose prose-sm sm:prose-base focus:outline-none text-black mx-4 max-w-none',
                },
            },
            content: tiptapJson?.tiptap,
            onTransaction: () => {
                // force re-render so `editor.isActive` works as expected
                editor = editor;
            },
            onUpdate: ({ editor }) => {
                onChange?.(editor.getJSON(), editor.storage.characterCount.words());
            },
            onCreate: ({ editor }) => {
                // Need to call this here because the formatting of editor.getJSON has the possibility of being different
                // from what's in the database.
                onCreate?.(editor.getJSON(), editor.storage.characterCount.words());
            },
        });
    });

    onDestroy(() => {
        editor?.destroy();
    });
</script>

<div class="relative grow">
    <div class="absolute bottom-0 left-0 right-0 top-0 overflow-y-scroll">
        <div bind:this={element} role="presentation" />
    </div>
</div>
