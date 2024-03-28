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
    import Tooltip from '$lib/components/Tooltip.svelte';

    export let editor: Editor | undefined;
    export let canEdit: boolean;

    function getCommentOptions(editor: Editor) {
        return {
            name: 'comment',
            onClick: () => {
                // Create a temporary comment mark so that we can create a span with id.
                // After the comment is created will replace with valid thread id.
                editor.chain().focus().setComments({ threadId: -1 }).run();
                let selectionRange = { from: editor.state.selection.from, to: editor.state.selection.to };

                let tempSpan = document.getElementById('thread-temp');
                tempSpan?.click();

                $createNewThreadCallback = (created: boolean, threadId: number, hasError: boolean) => {
                    editor.chain().setTextSelection(selectionRange).focus().unsetComments().run();
                    if (created) {
                        editor
                            .chain()
                            .focus()
                            .setComments({ threadId: threadId })
                            .setTextSelection(selectionRange.from)
                            .run();
                    }

                    if (!hasError) {
                        $createNewThreadCallback = () => {
                            return;
                        };
                    }
                };
            },
            isActive: editor.isActive('comments'),
            disabled:
                editor.isActive('comments') ||
                editor.state.selection.empty ||
                getMarkAttributes(editor.state, 'comments')?.comments,
            icon: CommentIcon,
        };
    }

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
        ];
    }
</script>

<div class="flex h-6 space-x-2">
    {#if editor}
        {@const commentOptions = getCommentOptions(editor)}
        {#if canEdit}
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
            <div class="divider divider-horizontal w-0" />
        {/if}
        <Tooltip
            position={{ left: '2rem', bottom: '0.2rem' }}
            class="flex border-primary align-middle text-primary"
            text="Add Comment"
        >
            <button
                class="btn btn-xs px-1 {commentOptions.disabled && '!bg-base-200'} {commentOptions.isActive
                    ? 'btn-primary'
                    : 'btn-link hover:bg-[#e6f7fc]'}"
                disabled={commentOptions.disabled}
                on:click={commentOptions.onClick}
            >
                <div class="mt-[-1px] scale-[85%]">
                    <svelte:component this={commentOptions.icon} />
                </div>
            </button>
        </Tooltip>
    {/if}
</div>
