<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Editor } from 'aquifer-tiptap';
    import type { TiptapContentItem } from '$lib/types/resources';
    import { extensions } from '../tiptap/config';
    import type { CommentStores } from '$lib/stores/comments';
    import type { ScriptDirection } from '$lib/types/base';
    import { scrollPosition, isScrollSyncEnabled, scrollSyncSourceDiv } from '$lib/stores/scrollSync';

    export let languageScriptDirection: ScriptDirection | undefined;
    export let tiptapJson: TiptapContentItem | undefined;
    export let onChange: ((tiptapJson: object, wordCount: number) => void) | undefined = undefined;
    export let onCreate: ((tiptapJson: object, wordCount: number) => void) | undefined = undefined;
    export let editor: Editor | undefined = undefined;
    export let canEdit: boolean;
    export let canComment: boolean;
    export let isLoading = false;
    export let commentStores: CommentStores;

    let scrollSyncElement: HTMLDivElement | undefined;
    let element: HTMLDivElement | undefined;

    $: updateEditor(tiptapJson);
    $: enableOrDisableEditing(canEdit);

    $: {
        if (
            $isScrollSyncEnabled &&
            scrollSyncElement &&
            $scrollSyncSourceDiv &&
            $scrollSyncSourceDiv !== scrollSyncElement
        ) {
            const scrollHeight = scrollSyncElement.scrollHeight;
            const clientHeight = scrollSyncElement.clientHeight;

            scrollSyncElement.scrollTop = $scrollPosition * (scrollHeight - clientHeight);
        }
    }

    const setScrollSyncElement = () => {
        $scrollSyncSourceDiv = scrollSyncElement;
    };

    const handleScroll = () => {
        if (scrollSyncElement) {
            const scrollHeight = scrollSyncElement.scrollHeight;
            const clientHeight = scrollSyncElement.clientHeight;
            const scrollTop = scrollSyncElement.scrollTop;

            $scrollPosition = Math.round((scrollTop / (scrollHeight - clientHeight)) * 1000) / 1000;
        }
    };

    function updateEditor(tiptapJson: TiptapContentItem | undefined) {
        if (tiptapJson && editor) {
            editor.commands.setContent(tiptapJson.tiptap);
        }
    }

    function enableOrDisableEditing(canEdit: boolean) {
        editor?.setEditable(canEdit);
    }

    onMount(async () => {
        if (scrollSyncElement) {
            scrollSyncElement.scrollTop = 0;
        }

        editor = new Editor({
            element,
            editable: canEdit,
            extensions: extensions(canComment, commentStores, true, languageScriptDirection),
            editorProps: {
                attributes: {
                    class: 'prose prose-sm sm:prose-base focus:outline-none text-black m-4 max-w-none',
                },
            },
            content: tiptapJson?.tiptap,
            onTransaction: () => {
                // force re-render so `editor.isActive` works as expected
                editor = editor;
            },
            onUpdate: ({ editor }) => {
                onChange?.(editor.getJSON(), editor.storage.characterCount.words());
            },
            onCreate: ({ editor }) => {
                // Need to call this here because the formatting of editor.getJSON has the possibility of being different
                // from what's in the database.
                onCreate?.(editor.getJSON(), editor.storage.characterCount.words());
            },
        });
    });

    onDestroy(() => {
        editor?.destroy();
    });
</script>

<div class="relative grow">
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        bind:this={scrollSyncElement}
        on:scroll={handleScroll}
        on:mouseenter={setScrollSyncElement}
        on:focus={setScrollSyncElement}
        class="absolute bottom-0 left-0 right-0 top-0 overflow-y-auto rounded-md border border-base-300 bg-white"
    >
        {#if isLoading}
            <div class="absolute h-full w-full">
                <div class="loading loading-infinity loading-lg absolute left-1/2 top-1/2 text-primary" />
            </div>
        {/if}
        <div
            dir={languageScriptDirection?.toLowerCase()}
            bind:this={element}
            role="presentation"
            class:blur-sm={isLoading}
        />
    </div>
</div>
