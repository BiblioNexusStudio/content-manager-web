<script lang="ts">
    import { type Editor, getMarkAttributes } from '@tiptap/core';
    import { createNewThreadCallback } from '$lib/stores/comments';
    import BoldIcon from '$lib/icons/BoldIcon.svelte';
    import ItalicsIcon from '$lib/icons/ItalicsIcon.svelte';
    import UnderlineIcon from '$lib/icons/UnderlineIcon.svelte';
    import UnorderedListIcon from '$lib/icons/UnorderedListIcon.svelte';
    import OrderedListIcon from '$lib/icons/OrderedListIcon.svelte';
    import Heading1Icon from '$lib/icons/Heading1Icon.svelte';
    import Heading2Icon from '$lib/icons/Heading2Icon.svelte';
    import Heading3Icon from '$lib/icons/Heading3Icon.svelte';
    import UndoIcon from '$lib/icons/UndoIcon.svelte';
    import RedoIcon from '$lib/icons/RedoIcon.svelte';
    import CommentIcon from '$lib/icons/CommentIcon.svelte';

    export let editor: Editor | undefined;

    function formattingOptions(editor: Editor) {
        return [
            {
                name: 'undo',
                onClick: () => {
                    editor.commands.undo();
                },
                disabled: !editor.can().undo(),
                isActive: false,
                icon: UndoIcon,
            },
            {
                name: 'redo',
                onClick: () => {
                    editor.commands.redo();
                },
                disabled: !editor.can().redo(),
                isActive: false,
                icon: RedoIcon,
            },
            {
                name: 'bold',
                onClick: () => {
                    editor.chain().focus().toggleBold().run();
                },
                isActive: editor.isActive('bold'),
                disabled: false,
                icon: BoldIcon,
            },
            {
                name: 'italic',
                onClick: () => {
                    editor.chain().focus().toggleItalic().run();
                },
                isActive: editor.isActive('italic'),
                disabled: false,
                icon: ItalicsIcon,
            },
            {
                name: 'underline',
                onClick: () => {
                    editor.chain().focus().toggleUnderline().run();
                },
                isActive: editor.isActive('underline'),
                disabled: false,
                icon: UnderlineIcon,
            },
            {
                name: 'bulletList',
                onClick: () => {
                    editor.chain().focus().toggleBulletList().run();
                },
                isActive: editor.isActive('bulletList'),
                disabled: false,
                icon: UnorderedListIcon,
            },
            {
                name: 'orderedList',
                onClick: () => {
                    editor.chain().focus().toggleOrderedList().run();
                },
                isActive: editor.isActive('orderedList'),
                disabled: false,
                icon: OrderedListIcon,
            },
            {
                name: 'header1',
                onClick: () => {
                    editor.chain().focus().toggleHeading({ level: 1 }).run();
                },
                isActive: editor.isActive('heading', { level: 1 }),
                disabled: false,
                icon: Heading1Icon,
            },
            {
                name: 'header2',
                onClick: () => {
                    editor.chain().focus().toggleHeading({ level: 2 }).run();
                },
                isActive: editor.isActive('heading', { level: 2 }),
                disabled: false,
                icon: Heading2Icon,
            },
            {
                name: 'header3',
                onClick: () => {
                    editor.chain().focus().toggleHeading({ level: 3 }).run();
                },
                isActive: editor.isActive('heading', { level: 3 }),
                disabled: false,
                icon: Heading3Icon,
            },
            {
                name: 'comment',
                onClick: () => {
                    // Create a temporary comment mark so that we can create a span with id.
                    // After the comment is created will replace with valid thread id.
                    editor.chain().focus().setComments({ threadId: -1 }).run();
                    let selectionRange = { from: editor.state.selection.from, to: editor.state.selection.to };

                    let tempSpan = document.getElementById('thread-temp');
                    tempSpan?.click();

                    $createNewThreadCallback = (created: boolean, threadId: number) => {
                        editor.chain().setTextSelection(selectionRange).focus().unsetComments().run();
                        if (created) {
                            editor.chain().focus().setComments({ threadId: threadId }).run();
                        }

                        $createNewThreadCallback = () => {
                            return;
                        };
                    };
                },
                isActive: editor.isActive('comments'),
                disabled:
                    editor.isActive('comments') ||
                    editor.state.selection.empty ||
                    getMarkAttributes(editor.state, 'comments')?.comments,
                icon: CommentIcon,
            },
        ];
    }
</script>

<div class="flex space-x-2">
    {#if editor}
        {#each formattingOptions(editor) as option (option.name)}
            <button
                class="btn btn-xs px-1 {option.disabled && '!bg-base-200'} {option.isActive
                    ? 'btn-primary'
                    : 'btn-link hover:bg-[#e6f7fc]'}"
                disabled={option.disabled}
                on:click={option.onClick}
            >
                <div class="mt-[-1px] scale-[85%]">
                    <svelte:component this={option.icon} />
                </div>
            </button>
        {/each}
    {/if}
</div>
