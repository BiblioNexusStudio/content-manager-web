<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor } from '@tiptap/core';
    import type { TiptapContentItem } from '$lib/types/resources';
    import { extensions } from '../tiptap/extensions';

    export let tiptapJson: TiptapContentItem | undefined;
    export let onChange: ((tiptapJson: object, wordCount: number) => void) | undefined = undefined;
    export let onCreate: ((tiptapJson: object, wordCount: number) => void) | undefined = undefined;
    export let editor: Editor | undefined = undefined;

    let element: HTMLDivElement | undefined;

    $: updateEditor(tiptapJson);

    function updateEditor(tiptapJson: TiptapContentItem | undefined) {
        if (tiptapJson && editor) {
            editor.commands.setContent(tiptapJson.tiptap);
        }
    }

    onMount(async () => {
        editor = new Editor({
            element,
            editable: !!onChange,
            extensions: extensions(),
            editorProps: {
                attributes: {
                    class: 'prose prose-sm sm:prose-base focus:outline-none text-black m-4 max-w-none',
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
                editor.commands.unsetTextDirection();
            },
        });
    });

    onDestroy(() => {
        editor?.destroy();
    });
</script>

<div class="relative grow">
    <div class="absolute bottom-0 left-0 right-0 top-0 overflow-y-auto rounded-md border border-base-300 bg-white">
        <div bind:this={element} role="presentation" />
    </div>
</div>
