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
    import TextDirection from 'tiptap-text-direction';
    import EditorToolbar from './EditorToolbar.svelte';
    import type { ResourceContentVersion, TiptapContentItem } from '$lib/types/resources';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';
    import { get } from 'svelte/store';

    export let canEdit: boolean;
    export let contentIndex: number;
    export let editableContentStore: ChangeTrackingStore<TiptapContentItem[]>;
    export let wordCountsByStep: number[];
    export let resourceContentVersion: ResourceContentVersion;

    let parentElement: HTMLDivElement | undefined;
    let editorElements: HTMLDivElement[] | undefined;
    let editors: Editor[] = [];

    $: currentEditor = editors[contentIndex];
    $: updateParentWithEditor(contentIndex);
    $: currentEditor?.setEditable(canEdit);

    function updateParentWithEditor(index: number) {
        const existing = parentElement?.firstChild;
        if (existing) {
            parentElement?.removeChild(existing);
        }
        const editorElement = editorElements?.[index];
        if (editorElement) {
            parentElement?.append(editorElement);
        }
        currentEditor?.commands.focus();
    }

    onMount(async () => {
        const tiptapValues = canEdit
            ? get(editableContentStore).original
            : (resourceContentVersion.content as TiptapContentItem[]);
        if (tiptapValues) {
            editorElements = tiptapValues.map((_) => document.createElement('div'));
            editors = tiptapValues.map(
                (content, index) =>
                    new Editor({
                        element: editorElements?.[index],
                        editable: canEdit,
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
                        content: content.tiptap,
                        onTransaction: () => {
                            // force re-render so `editor.isActive` works as expected
                            currentEditor = currentEditor;
                        },
                        onUpdate: ({ editor }) => {
                            if (canEdit) {
                                editableContentStore.updateUpdated((contents) => {
                                    if (contents[index]) {
                                        contents[index]!.tiptap = editor.getJSON();
                                    }
                                    return contents;
                                });
                                wordCountsByStep[index] = editor.storage.characterCount.words();
                            }
                        },
                        onCreate: ({ editor }) => {
                            // Need to call this here because the formatting of editor.getJSON has the possibility of being different
                            // from what's in the database.
                            if (canEdit) {
                                editableContentStore.updateOriginalAndUpdated((contents) => {
                                    if (contents[index]) {
                                        contents[index]!.tiptap = editor.getJSON();
                                    }
                                    return contents;
                                });
                                wordCountsByStep[index] = editor.storage.characterCount.words();
                            }
                        },
                    })
            );
            updateParentWithEditor(contentIndex);
        }
    });

    onDestroy(() => {
        if (editors) {
            editors.forEach((e) => e.destroy());
        }
    });
</script>

{#if currentEditor && canEdit}
    <div class="absolute inset-x-0 top-[60px] z-20 flex h-16 w-[calc(100%-10px)] items-center rounded-md bg-white">
        <EditorToolbar editor={currentEditor} />
    </div>
{/if}

<div bind:this={parentElement} role="presentation" />
