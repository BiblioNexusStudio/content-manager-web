<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor } from 'aquifer-tiptap';
    import type { TiptapContentItem } from '$lib/types/resources';
    import { extensions } from '../tiptap/config';
    import type { CommentStores } from '$lib/stores/comments';
    import { scrollSync } from '$lib/stores/scrollSync.svelte.ts';
    import type { Language } from '$lib/types/base';

    export let language: Language;
    export let tiptapJson: TiptapContentItem | undefined;
    export let onChange: ((tiptapJson: object, wordCount: number, charCount: number) => void) | undefined = undefined;
    export let onCreate: ((tiptapJson: object, wordCount: number, charCount: number) => void) | undefined = undefined;
    export let editor: Editor | undefined = undefined;
    export let canEdit: boolean;
    export let canComment: boolean;
    export let isLoading = false;
    export let commentStores: CommentStores;
    export let blurOnPendingAiTranslate = false;
    export let isSourceContentArea = false;

    let element: HTMLDivElement | undefined;

    $: updateEditor(tiptapJson);
    $: enableOrDisableEditing(canEdit);

    function updateEditor(tiptapJson: TiptapContentItem | undefined) {
        if (tiptapJson && editor) {
            editor.commands.setContent(tiptapJson.tiptap);
        }
    }

    function enableOrDisableEditing(canEdit: boolean) {
        editor?.setEditable(canEdit);
    }

    onMount(() => {
        editor = new Editor({
            element,
            editable: canEdit,
            extensions: extensions(canComment, commentStores, true, language.scriptDirection, isSourceContentArea),
            editorProps: {
                attributes: {
                    class: 'prose prose-sm sm:prose-base focus:outline-none text-black m-4 max-w-none',
                },
            },
            content: tiptapJson?.tiptap,
            onTransaction: () => {
                // force re-render so `editor.isActive` works as expected
                editor = editor;

                if (editor) {
                    onChange?.(
                        editor.getJSON(),
                        editor.storage.characterCount.words(),
                        editor.storage.characterCount.characters()
                    );
                }
            },
            onUpdate: ({ editor }) => {
                onChange?.(
                    editor.getJSON(),
                    editor.storage.characterCount.words(),
                    editor.storage.characterCount.characters()
                );
            },
            onCreate: ({ editor }) => {
                // Need to call this here because the formatting of editor.getJSON has the possibility of being different
                // from what's in the database.
                onCreate?.(
                    editor.getJSON(),
                    editor.storage.characterCount.words(),
                    editor.storage.characterCount.characters()
                );
            },
        });
    });

    onDestroy(() => {
        editor?.destroy();
    });
</script>

<div class="relative grow">
    <div
        use:scrollSync
        class="absolute bottom-0 left-0 right-0 top-0 overflow-y-auto rounded-md border border-base-300 bg-white"
        class:blur-sm={blurOnPendingAiTranslate}
    >
        {#if isLoading}
            <div class="absolute h-full w-full">
                <div class="loading loading-infinity loading-lg absolute left-1/2 top-1/2 text-primary"></div>
            </div>
        {/if}
        <div dir={language.scriptDirection} bind:this={element} role="presentation" class:blur-sm={isLoading}></div>
    </div>
    {#if blurOnPendingAiTranslate}
        <div
            class="absolute bottom-0 left-0 right-0 top-0 flex flex-col items-center bg-white bg-opacity-75 py-16 text-xl font-semibold text-primary"
        >
            <h1 class="mb-4">
                AI {language.iso6393Code.toLowerCase() === 'eng' ? 'Aquiferization' : 'Translation'} in progress.
            </h1>
            <p class="max-w-80 text-center">The page will refresh automatically when it is complete.</p>
        </div>
    {/if}
</div>
