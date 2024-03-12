<script lang="ts">
    import type { Editor } from '@tiptap/core';
    import type { Level } from '@tiptap/extension-heading';
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
    import type { ComponentType } from 'svelte';

    export let editor: Editor;

    const headerLevels: { level: Level; icon: ComponentType }[] = [
        { level: 1, icon: Heading1Icon },
        { level: 2, icon: Heading2Icon },
        { level: 3, icon: Heading3Icon },
    ];

    const formattingOptions = [
        {
            name: 'undo',
            onClick: () => {
                editor.commands.undo();
            },
            disabled: !editor.can().undo(),
            icon: UndoIcon,
        },
        {
            name: 'redo',
            onClick: () => {
                editor.commands.redo();
            },
            disabled: !editor.can().redo(),
            icon: RedoIcon,
        },
        {
            name: 'bold',
            onClick: () => {
                editor.chain().focus().toggleBold().run();
            },
            icon: BoldIcon,
        },
        {
            name: 'italic',
            onClick: () => {
                editor.chain().focus().toggleItalic().run();
            },
            icon: ItalicsIcon,
        },
        {
            name: 'underline',
            onClick: () => {
                editor.chain().focus().toggleUnderline().run();
            },
            icon: UnderlineIcon,
        },
        {
            name: 'bulletList',
            onClick: () => {
                editor.chain().focus().toggleBulletList().run();
            },
            icon: UnorderedListIcon,
        },
        {
            name: 'orderedList',
            onClick: () => {
                editor.chain().focus().toggleOrderedList().run();
            },
            icon: OrderedListIcon,
        },
    ];
</script>

<div class="mx-6 mt-2">
    {#each formattingOptions as option (option.name)}
        <button
            class="btn btn-xs mx-1 px-0 hover:bg-[#e6f7fc] {option.disabled && '!bg-white'} {editor.isActive(
                option.name
            )
                ? 'btn-primary'
                : 'btn-link'}"
            disabled={option.disabled}
            on:click={option.onClick}
        >
            <svelte:component this={option.icon} />
        </button>
    {/each}
    {#each headerLevels as header (header.level)}
        <button
            class="btn btn-xs mx-0.5 px-1 hover:bg-[#e6f7fc] {editor.isActive('heading', {
                level: header.level,
            })
                ? 'btn-primary'
                : 'btn-link'}"
            on:click={() => {
                editor.chain().focus().toggleHeading({ level: header.level }).run();
            }}
        >
            <svelte:component this={header.icon} />
        </button>
    {/each}
</div>
