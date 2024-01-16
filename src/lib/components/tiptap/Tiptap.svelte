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
    import type { Level } from '@tiptap/extension-heading';
    import Underline from '@tiptap/extension-underline';
    import BoldIcon from '$lib/icons/BoldIcon.svelte';
    import ItalicsIcon from '$lib/icons/ItalicsIcon.svelte';
    import UnderlineIcon from '$lib/icons/UnderlineIcon.svelte';
    import UnorderedListIcon from '$lib/icons/UnorderedListIcon.svelte';
    import OrderedListIcon from '$lib/icons/OrderedListIcon.svelte';
    import Heading1Icon from '$lib/icons/Heading1Icon.svelte';
    import Heading2Icon from '$lib/icons/Heading2Icon.svelte';
    import Heading3Icon from '$lib/icons/Heading3Icon.svelte';
    import {
        updatedValues,
        currentStepNumber,
        originalValues,
        userStoppedEditing,
        type TiptapContentValues,
    } from '$lib/stores/tiptapContent';
    import * as customMarks from '$lib/components/tiptap/customMarks';
    import type { ComponentType } from 'svelte';

    export let hasSteps = false;
    export let canEdit: boolean;

    let parentElement: HTMLDivElement | undefined;
    let editorElements: HTMLDivElement[];
    let editors: Editor[] = [];
    let timeout: number | undefined;
    $: currentEditor = editors[$currentStepNumber - 1];
    $: updateParentWithEditor($currentStepNumber);
    $: updateEditorsWhenOriginalValuesChange($originalValues);
    $: currentEditor?.setEditable(canEdit);

    function updateParentWithEditor(stepNumber: number | undefined) {
        if (stepNumber) {
            const existing = parentElement?.firstChild;
            if (existing) {
                parentElement?.removeChild(existing);
            }
            parentElement?.append(editorElements[stepNumber - 1]);
            currentEditor?.commands.focus();
        }
    }

    function updateEditorsWhenOriginalValuesChange(originalValues: TiptapContentValues) {
        editors.forEach((editor, index) => {
            const selection = editor.state.selection;
            editor.commands.setContent(originalValues.content![index].tiptap!);
            levelSetOriginalAndUpdatedState(editor, index);
            editor.commands.setTextSelection(selection);
            editor.commands.focus();
        });
    }

    function levelSetOriginalAndUpdatedState(editor: Editor, index: number) {
        $originalValues.content![index].tiptap = editor.getJSON();
        $updatedValues.content![index].tiptap = editor.getJSON();
        $originalValues.wordCounts ||= [];
        $originalValues.wordCounts[index] = editor.storage.characterCount.words();
        $updatedValues.wordCounts ||= [];
        $updatedValues.wordCounts![index] = editor.storage.characterCount.words();
    }

    function startDebounce() {
        if ($userStoppedEditing) {
            $userStoppedEditing = false;
        }

        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = window.setTimeout(() => {
            $userStoppedEditing = true;
            clearTimeout(timeout);
        }, 3000);
    }

    onMount(async () => {
        editorElements = $originalValues.content!.map((_) => document.createElement('div'));
        editors = $originalValues.content!.map(
            (content, index) =>
                new Editor({
                    element: editorElements[index],
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
                    ],
                    editorProps: {
                        attributes: {
                            class: 'prose dark:prose-invert prose-sm sm:prose-base focus:outline-none text-black mx-4 max-w-none',
                        },
                    },
                    content: content.tiptap,
                    onTransaction: () => {
                        // force re-render so `editor.isActive` works as expected
                        currentEditor = currentEditor;
                    },
                    onUpdate: ({ editor }) => {
                        $updatedValues.content![index].tiptap = editor.getJSON();
                        $updatedValues.wordCounts ||= [];
                        $updatedValues.wordCounts[index] = editor.storage.characterCount.words();
                    },
                    onCreate: ({ editor }) => {
                        // Need to call this here because the formatting of editor.getJSON has the possibility of being different
                        // from what's in the database.
                        levelSetOriginalAndUpdatedState(editor, index);
                    },
                })
        );
        updateParentWithEditor($currentStepNumber);
    });

    onDestroy(() => {
        if (editors) {
            editors.forEach((e) => e.destroy());
        }
    });

    // Intentionally adding comments blocks here.
    // once this page is used for editing, we may want to reuse this code.

    // const addImage = () => {
    //     const url = window.prompt('URL');

    //     if (url) {
    //         editor.chain().focus().setImage({ src: url }).run();
    //     }
    // };

    const headerLevels: { level: Level; icon: ComponentType }[] = [
        { level: 1, icon: Heading1Icon },
        { level: 2, icon: Heading2Icon },
        { level: 3, icon: Heading3Icon },
    ];

    const formattingOptions = [
        {
            name: 'bold',
            onClick: () => currentEditor.chain().focus().toggleBold().run(),
            icon: BoldIcon,
        },
        {
            name: 'italic',
            onClick: () => currentEditor.chain().focus().toggleItalic().run(),
            icon: ItalicsIcon,
        },
        {
            name: 'underline',
            onClick: () => currentEditor.chain().focus().toggleUnderline().run(),
            icon: UnderlineIcon,
        },
        {
            name: 'bulletList',
            onClick: () => currentEditor.chain().focus().toggleBulletList().run(),
            icon: UnorderedListIcon,
        },
        {
            name: 'orderedList',
            onClick: () => currentEditor.chain().focus().toggleOrderedList().run(),
            icon: OrderedListIcon,
        },
    ];

    const getContentTopPadding = () => {
        if (canEdit && hasSteps) {
            return 'pt-28';
        } else if (canEdit && !hasSteps) {
            return 'pt-16';
        } else if (!canEdit && hasSteps) {
            return 'pt-14';
        } else if (!canEdit && !hasSteps) {
            return 'pt-2';
        }
    };
</script>

{#if currentEditor && canEdit}
    <div
        class="absolute inset-x-0 {hasSteps
            ? 'top-[84px]'
            : 'top-[44px]'} z-20 flex h-16 w-[calc(100%-10px)] items-center rounded-md bg-white"
    >
        <div class="mx-6 mt-2">
            {#each formattingOptions as option}
                <button
                    class="btn btn-xs mx-1 px-0 hover:bg-[#e6f7fc] {currentEditor.isActive(option.name)
                        ? 'btn-primary'
                        : 'btn-link'}"
                    on:click={option.onClick}
                >
                    <svelte:component this={option.icon} />
                </button>
            {/each}
            {#each headerLevels as header}
                <button
                    class="btn btn-xs mx-0.5 px-1 hover:bg-[#e6f7fc] {currentEditor.isActive('heading', {
                        level: header.level,
                    })
                        ? 'btn-primary'
                        : 'btn-link'}"
                    on:click={() => currentEditor.chain().focus().toggleHeading({ level: header.level }).run()}
                >
                    <svelte:component this={header.icon} />
                </button>
            {/each}
            <!--        <button class="btn btn-accent btn-outline btn-xs my-1" on:click={addImage}> Image </button>-->
        </div>
    </div>
{/if}

<div class={getContentTopPadding()} bind:this={parentElement} on:keydown={startDebounce} role="presentation" />
