<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor } from '@tiptap/core';
    import StarterKit from '@tiptap/starter-kit';
    import Image from '@tiptap/extension-image';
    import Link from '@tiptap/extension-link';
    import { generateHTML } from '@tiptap/html';

    export let jsonOutput: string | undefined;
    export let htmlOutput: string;

    let element: Element | undefined;
    let editor: Editor;

    export let htmlDefault: any;

    onMount(() => {
        editor = new Editor({
            element: element,
            editable: false,
            extensions: [StarterKit, Image, Link],
            editorProps: {
                attributes: {
                    class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none text-black mx-4',
                },
            },
            content: htmlDefault,
            onTransaction: () => {
                // force re-render so `editor.isActive` works as expected
                editor = editor;
            },
            onUpdate: ({ editor }) => {
                jsonOutput = JSON.stringify(editor.getJSON(), null, 2);
                console.log(jsonOutput);
                htmlOutput = editor.getHTML();
                console.log(htmlOutput);
            },
            onCreate: ({ editor }) => {
                jsonOutput = JSON.stringify(editor.getJSON(), null, 2);
                console.log(jsonOutput);
                //htmlOutput = editor.getHTML();
                htmlOutput = generateHTML(editor.getJSON(), [StarterKit, Image, Link]);
                console.log(htmlOutput);
            },
        });
    });

    onDestroy(() => {
        if (editor) {
            editor.destroy();
        }
    });

    const addImage = () => {
        const url = window.prompt('URL');

        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const addLink = () => {
        const url = window.prompt('URL');

        if (url) {
            editor.chain().focus().toggleLink({ href: url }).run();
        }
    };
</script>

{#if editor}
    <div class="m-4">
        <!-- Intentionally adding comments blocks here.  
             once this page is used for editing, we may want to reuse this code. 

        <span class="join join-horizontal my-1">
            <button
                class="btn btn-outline join-item btn-xs"
                on:click={() => editor.chain().focus().toggleBold().run()}
                class:btn-primary={editor.isActive('bold')}
            >
                B
            </button>
            <button
                class="btn btn-outline join-item btn-xs"
                on:click={() => editor.chain().focus().toggleItalic().run()}
                class:btn-primary={editor.isActive('italic')}
            >
                I
            </button>
        </span>
        <button
            class="btn btn-outline btn-xs my-1"
            on:click={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            class:btn-primary={editor.isActive('heading', { level: 1 })}
        >
            H1
        </button>
        <button
            class="btn btn-outline btn-xs my-1"
            on:click={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            class:btn-primary={editor.isActive('heading', { level: 2 })}
        >
            H2
        </button>
        <button
            class="btn btn-outline btn-xs my-1"
            on:click={() => editor.chain().focus().setParagraph().run()}
            class:btn-primary={editor.isActive('paragraph')}
        >
            P
        </button>
        <span class="join join-horizontal my-1">
            <button
                class="btn btn-outline join-item btn-xs"
                on:click={() => editor.chain().focus().toggleBulletList().run()}
                class:btn-primary={editor.isActive('bulletList')}
            >
                Bullet
            </button>
            <button
                class="btn btn-outline join-item btn-xs"
                on:click={() => editor.chain().focus().toggleOrderedList().run()}
                class:btn-primary={editor.isActive('orderedList')}
            >
                Ordered
            </button>
        </span>
        <button class="btn btn-accent btn-outline btn-xs my-1" on:click={addImage}> Image </button>
        <button class="btn btn-accent btn-outline btn-xs my-1" on:click={addLink}> Link </button>
        -->
    </div>
{/if}

<div class="h-5/6 overflow-scroll" bind:this={element} />

<style>
</style>
