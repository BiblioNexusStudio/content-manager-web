<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor } from 'aquifer-tiptap';
    import type { TiptapContentItem } from '$lib/types/resources';
    import { extensions } from '../tiptap/config';
    import type { CommentStores } from '$lib/stores/comments';
    import { scrollSync } from '$lib/stores/scrollSync.svelte.ts';
    import type { Language } from '$lib/types/base';
    import { createEditor } from './createEditor';
    import type { Readable } from 'svelte/store';
    import { darkMode } from '$lib/stores/app';

    interface TipTapRenderProps {
        language: Language;
        tiptapJson: TiptapContentItem | undefined;
        onChange?: ((tiptapJson: object, wordCount: number, charCount: number) => void) | undefined;
        onCreate?: ((tiptapJson: object, wordCount: number, charCount: number) => void) | undefined;
        editor?: Readable<Editor> | undefined;
        canEdit: boolean;
        canComment: boolean;
        isLoading?: boolean;
        commentStores: CommentStores;
        blurOnPendingAiTranslate?: boolean;
        isSourceContentArea?: boolean;
    }

    let {
        language,
        tiptapJson,
        onChange = undefined,
        onCreate = undefined,
        editor = $bindable(),
        canEdit,
        canComment,
        isLoading = $bindable(false),
        commentStores,
        blurOnPendingAiTranslate = false,
        isSourceContentArea = false,
    }: TipTapRenderProps = $props();

    let element: HTMLDivElement;
    let lastProcessedTiptapJson: TiptapContentItem | undefined;

    function updateEditor(tiptapJson: TiptapContentItem | undefined) {
        if (tiptapJson && $editor) {
            if (lastProcessedTiptapJson && tiptapJson.tiptap === lastProcessedTiptapJson.tiptap) return;

            $editor?.commands.setContent(tiptapJson.tiptap);
            lastProcessedTiptapJson = tiptapJson;
        }
    }

    function enableOrDisableEditing(canEdit: boolean) {
        $editor?.setEditable(canEdit);
    }

    $effect(() => {
        updateEditor(tiptapJson);
    });
    $effect(() => {
        enableOrDisableEditing(canEdit);
    });

    onMount(() => {
        editor = createEditor({
            element,
            editable: canEdit,
            extensions: extensions(canComment, commentStores, true, language.scriptDirection, isSourceContentArea),
            editorProps: {
                attributes: {
                    class: `prose prose-sm sm:prose-base focus:outline-hidden max-w-none ${$darkMode ? 'text-content p-4' : 'text-black m-4'}`,
                },
            },
            content: tiptapJson?.tiptap,
            autofocus: true,
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
        if ($editor && !$editor.isDestroyed) {
            $editor.off('transaction');
            $editor.destroy();
        }
    });
</script>

<div class="relative grow">
    <div
        use:scrollSync
        class={`border-base-300 absolute top-0 right-0 bottom-0 left-0 overflow-y-auto rounded-md border ${$darkMode ? '' : 'bg-white'}`}
        class:blur-sm={blurOnPendingAiTranslate}
    >
        {#if isLoading}
            <div class="absolute h-full w-full">
                <div class="loading loading-infinity loading-lg text-primary absolute top-1/2 left-1/2"></div>
            </div>
        {/if}
        <div dir={language.scriptDirection} bind:this={element} role="presentation" class:blur-sm={isLoading}></div>
    </div>
    {#if blurOnPendingAiTranslate}
        <div
            class="text-primary bg-opacity-75 absolute top-0 right-0 bottom-0 left-0 flex flex-col items-center bg-white py-16 text-xl font-semibold"
        >
            <h1 class="mb-4">
                AI {language.iso6393Code.toLowerCase() === 'eng' ? 'Aquiferization' : 'Translation'} in progress.
            </h1>
            <p class="max-w-80 text-center">The page will refresh automatically when it is complete.</p>
        </div>
    {/if}
</div>
