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

    let htmlDefault =
        '<p class="h1">HABAKKUK (P<span class="lc">erson</span>)</p><p class="fl">Author of the eighth book of the Minor Prophets. The meaning of Habakkuk’s name is uncertain. It was probably derived from a Hebrew word meaning “to embrace.”</p><p>Nothing is known about Habakkuk apart from what can be inferred from his book. Several legends purporting to give accounts of his life are generally regarded as untrustworthy. The apocryphal book Bel and the Dragon describes a miraculous transporting of Habakkuk to Daniel while Daniel was in the den of lions. A Jewish legend makes Habakkuk the son of the Shunammite woman mentioned in <a href="?bref=2Kgs.4.8-37">2 Kings 4:8-37</a>. That legend apparently is based on the tradition that she would “embrace” a son. Chronological difficulties make both accounts unlikely.</p><p>Habakkuk lived in the period during the rise of the Chaldeans (<a href="?bref=Hab.1.6">Hb 1:6</a>), that is, during the reigns of the Judean kings Josiah and Jehoiakim. The dates 612–589 <span class="era">BC</span> delineate the probable period of his prophetic activity.</p><p>The book of Habakkuk reveals a man of great sensitivity. His deep concern about injustice and his prayer (<a href="?bref=Hab.3.1-19">Hb 3</a>) show that Habakkuk was characterized by profound religious conviction and social awareness.</p><p><span class="ital">See also</span> <a href="?item=HabakkukBookof_Article_TyndaleOpenBibleDictionary">Habakkuk, Book of</a>; <a href="?item=ProphetProphetess_Article_TyndaleOpenBibleDictionary">Prophet, Prophetess</a>.</p>';

    onMount(() => {
        editor = new Editor({
            element: element,
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
    </div>
{/if}

<div class="h-5/6 overflow-scroll" bind:this={element} />

<style>
</style>
