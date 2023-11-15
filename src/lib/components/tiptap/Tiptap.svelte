<script lang="ts">
    import { onMount, onDestroy, tick } from 'svelte';
    import { Editor } from '@tiptap/core';
    // import StarterKit from '@tiptap/starter-kit';
    import Image from '@tiptap/extension-image';
    import Link from '@tiptap/extension-link';
    // import { generateHTML } from '@tiptap/html';
    import { type Level, Heading } from '@tiptap/extension-heading';
    import Italic from '@tiptap/extension-italic';
    import Paragraph from '@tiptap/extension-paragraph';
    import Document from '@tiptap/extension-document';
    import Text from '@tiptap/extension-text';
    import ListItem from '@tiptap/extension-list-item';
    import BulletList from '@tiptap/extension-bullet-list';
    import OrderedList from '@tiptap/extension-ordered-list';
    import Bold from '@tiptap/extension-bold';
    import { Underline } from '@tiptap/extension-underline';
    import BoldIcon from '$lib/icons/BoldIcon.svelte';
    import ItalicsIcon from '$lib/icons/ItalicsIcon.svelte';
    import UnderlineIcon from '$lib/icons/UnderlineIcon.svelte';
    import UnorderedListIcon from '$lib/icons/UnorderedListIcon.svelte';
    import OrderedListIcon from '$lib/icons/OrderedListIcon.svelte';
    import LinkIcon from '$lib/icons/LinkIcon.svelte';
    import Heading1Icon from '$lib/icons/Heading1Icon.svelte';
    import Heading2Icon from '$lib/icons/Heading2Icon.svelte';
    import Heading3Icon from '$lib/icons/Heading3Icon.svelte';
    import { canEdit } from '$lib/stores/auth';
    import { updatedValues, currentStepNumber } from '$lib/stores/tiptapContent';
    import * as customMarks from '$lib/components/tiptap/customMarks';
    import type { ComponentType } from 'svelte';

    let element: Element | undefined;
    let editor: Editor;

    let setContent = (index: number) => {
        // Doing $: editor?. causes a reset from onTransaction below, because editor changes.
        // Having the separate setContent function prevents it from firing constantly
        editor?.commands?.setContent($updatedValues.content![index].tiptap ?? '');
    };

    $: setContent($currentStepNumber - 1);
    $: editor?.setEditable($canEdit);

    console.log($updatedValues.content![$currentStepNumber - 1].tiptap);

    onMount(async () => {
        await tick();

        editor = new Editor({
            element: element,
            editable: $canEdit,
            extensions: [
                Bold,
                BulletList,
                Document,
                Heading,
                Image,
                Italic,
                Link.configure({
                    openOnClick: false,
                }),
                ListItem,
                OrderedList,
                Paragraph,
                Text,
                Underline,
                customMarks.bibleReferenceMark,
                customMarks.resourceReferenceMark,
            ],
            editorProps: {
                attributes: {
                    class: 'prose dark:prose-invert prose-sm sm:prose-base focus:outline-none text-black mx-4 max-w-none',
                },
            },
            content: $updatedValues.content![$currentStepNumber - 1].tiptap,
            onTransaction: () => {
                // force re-render so `editor.isActive` works as expected
                editor = editor;
            },
            onUpdate: ({ editor }) => {
                // updatedValues.update((x) => {
                //     x.content![$currentStepNumber - 1].tiptap = editor.getJSON();
                //     return x;
                // });
                $updatedValues.content![$currentStepNumber - 1].tiptap = editor.getJSON();
            },
            //onCreate: () => {},
        });
    });

    onDestroy(() => {
        if (editor) {
            editor.destroy();
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

    const addLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url: string | null = window.prompt('URL', previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // update link
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const headerLevels: { level: Level; icon: ComponentType }[] = [
        { level: 1, icon: Heading1Icon },
        { level: 2, icon: Heading2Icon },
        { level: 3, icon: Heading3Icon },
    ];

    const formattingOptions = [
        {
            name: 'bold',
            onClick: () => editor.chain().focus().toggleBold().run(),
            icon: BoldIcon,
        },
        {
            name: 'italic',
            onClick: () => editor.chain().focus().toggleItalic().run(),
            icon: ItalicsIcon,
        },
        {
            name: 'underline',
            onClick: () => editor.chain().focus().toggleUnderline().run(),
            icon: UnderlineIcon,
        },
        {
            name: 'bulletList',
            onClick: () => editor.chain().focus().toggleBulletList().run(),
            icon: UnorderedListIcon,
        },
        {
            name: 'orderedList',
            onClick: () => editor.chain().focus().toggleOrderedList().run(),
            icon: OrderedListIcon,
        },
    ];
</script>

{#if editor && $canEdit}
    <div class="mx-4 mb-2">
        {#each formattingOptions as option}
            <button
                class="btn btn-xs mx-1 px-0 {editor.isActive(option.name) ? 'btn-primary' : 'btn-link'}"
                on:click={option.onClick}
            >
                <svelte:component this={option.icon} />
            </button>
        {/each}
        <span class="join join-horizontal">
            {#each headerLevels as header}
                <button
                    class="btn btn-primary btn-outline join-item btn-xs text-primary {editor.isActive('heading', {
                        level: header.level,
                    })
                        ? 'btn-active'
                        : ''}"
                    on:click={() => editor.chain().focus().toggleHeading({ level: header.level }).run()}
                >
                    <svelte:component this={header.icon} />
                </button>
            {/each}
        </span>
        <!--        <button class="btn btn-accent btn-outline btn-xs my-1" on:click={addImage}> Image </button>-->
        <button class="btn btn-xs mx-1 px-0 {editor.isActive('link') ? 'btn-primary' : 'btn-link'}" on:click={addLink}>
            <LinkIcon />
        </button>
    </div>
{/if}

<div class="h-5/6 overflow-scroll" bind:this={element} />

<style>
    :global(.prose :where(a):not(:where([class~='not-prose'] *))) {
        color: hsl(var(--p) / var(--tw-text-opacity));
    }
</style>
