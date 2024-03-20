<script lang="ts">
    import { onDestroy } from 'svelte';
    import { Editor } from '@tiptap/core';
    import type { TiptapContentItem } from '$lib/types/resources';
    import HtmlDiffWorker from '../../../workers/html-differ.ts?worker';
    import CenteredSpinner from '../CenteredSpinner.svelte';
    import { debounce } from '$lib/utils/debounce';
    import { extensions } from '../tiptap/extensions';

    export let tiptapJson: TiptapContentItem | undefined;
    export let currentTiptapJsonForDiffing: TiptapContentItem | undefined;

    $: calculateBaseHtmlWithTextDirection(tiptapJson);
    $: debouncedGenerateDiffHtml(currentTiptapJsonForDiffing);

    let diffWorker: Worker | null = null;
    let diffedHtml: string | undefined;
    let currentTiptapJsonString: string | undefined;
    let baseHtmlWithTextDirection: string | undefined;

    async function calculateBaseHtmlWithTextDirection(tiptapJson: TiptapContentItem | undefined) {
        if (tiptapJson) {
            baseHtmlWithTextDirection = await getHtmlWithTextDirection(tiptapJson);
        }
    }

    async function getHtmlWithTextDirection(tiptapJson: TiptapContentItem): Promise<string> {
        let transactionCount = 0;
        return new Promise((resolve) => {
            new Editor({
                editable: false,
                extensions: extensions(),
                content: tiptapJson.tiptap,
                onTransaction: ({ editor }) => {
                    if (transactionCount > 1) {
                        resolve(editor.getHTML());
                    }
                    transactionCount++;
                },
                onCreate: ({ editor }) => {
                    editor.commands.setContent(editor.getJSON());
                    editor.commands.setTextDirection('auto');
                },
            });
        });
    }

    const debouncedGenerateDiffHtml = debounce(async (currentTiptapJsonForDiffing: TiptapContentItem | undefined) => {
        if (
            currentTiptapJsonForDiffing &&
            baseHtmlWithTextDirection &&
            currentTiptapJsonString !== JSON.stringify(currentTiptapJsonForDiffing.tiptap)
        ) {
            const currentHtml = await getHtmlWithTextDirection(currentTiptapJsonForDiffing);
            currentTiptapJsonString = JSON.stringify(currentTiptapJsonForDiffing.tiptap);

            // Terminate the previous worker if it exists
            if (diffWorker) {
                diffWorker.terminate();
            }

            diffWorker = new HtmlDiffWorker();
            diffWorker.onmessage = (event) => {
                diffedHtml = event.data;
            };

            diffWorker.postMessage({ baseHtml: baseHtmlWithTextDirection, currentHtml });
        }
    }, 750);

    onDestroy(() => diffWorker && diffWorker.terminate());
</script>

<div class="relative grow">
    <div class="absolute bottom-0 left-0 right-0 top-0 overflow-y-scroll rounded-md border border-base-300 bg-white">
        {#if diffedHtml}
            <div class="prose prose-sm m-4 max-w-none text-black sm:prose-base focus:outline-none">
                {@html diffedHtml}
            </div>
        {:else}
            <CenteredSpinner />
        {/if}
    </div>
</div>
