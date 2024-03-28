<script lang="ts">
    import { onDestroy } from 'svelte';
    import { Editor } from '@tiptap/core';
    import type { TiptapContentItem } from '$lib/types/resources';
    import HtmlDiffWorker from '../../../workers/html-differ.ts?worker';
    import CenteredSpinner from '../CenteredSpinner.svelte';
    import { debounce } from '$lib/utils/debounce';
    import { extensions } from '../tiptap/extensions';
    import { log } from '$lib/logger';

    export let tiptapJson: TiptapContentItem | undefined;
    export let currentTiptapJsonForDiffing: TiptapContentItem | undefined;

    $: calculateBaseHtmlWithTextDirection(tiptapJson);
    $: debouncedGenerateDiffHtml(currentTiptapJsonForDiffing, baseHtmlWithTextDirection);

    let diffWorker: Worker | null = null;
    let diffedHtml: string | undefined;
    let currentTiptapJsonString: string | undefined;
    let previousBaseHtmlWithTextDirection: string | undefined;
    let baseHtmlWithTextDirection: string | undefined;

    async function calculateBaseHtmlWithTextDirection(tiptapJson: TiptapContentItem | undefined) {
        if (tiptapJson) {
            diffedHtml = undefined;
            baseHtmlWithTextDirection = await getHtmlWithTextDirection(tiptapJson);
        }
    }

    // Unfortunately because of the text direction plugin we have, we can't just use the built-in `generateHtml`
    // that Tiptap provides. Instead this will spin up an editor and force a render to make sure the text direction
    // tags get added to the content.
    async function getHtmlWithTextDirection(tiptapJson: TiptapContentItem): Promise<string> {
        let transactionCount = 0;
        return new Promise((resolve) => {
            new Editor({
                editable: false,
                extensions: extensions(false),
                content: tiptapJson.tiptap,
                onTransaction: ({ editor }) => {
                    if (transactionCount > 1) {
                        resolve(editor.getHTML());
                    }
                    transactionCount++;
                },
                onCreate: ({ editor }) => {
                    editor.commands.setContent(editor.getJSON());
                    editor.commands.unsetTextDirection();
                },
            });
        });
    }

    const debouncedGenerateDiffHtml = debounce(
        async (
            currentTiptapJsonForDiffing: TiptapContentItem | undefined,
            baseHtmlWithTextDirection: string | undefined
        ) => {
            if (
                currentTiptapJsonForDiffing &&
                baseHtmlWithTextDirection &&
                (currentTiptapJsonString !== JSON.stringify(currentTiptapJsonForDiffing.tiptap) ||
                    previousBaseHtmlWithTextDirection !== baseHtmlWithTextDirection)
            ) {
                const currentHtml = await getHtmlWithTextDirection(currentTiptapJsonForDiffing);
                currentTiptapJsonString = JSON.stringify(currentTiptapJsonForDiffing.tiptap);
                previousBaseHtmlWithTextDirection = baseHtmlWithTextDirection;

                if (diffWorker) {
                    diffWorker.terminate();
                }

                // Spin up a web worker since the HTML diffing is CPU intensive and causes UI stutters if on the main thread.
                diffWorker = new HtmlDiffWorker();
                diffWorker.onmessage = (event) => {
                    if (event.data.success) {
                        diffedHtml = event.data.success;
                    } else if (event.data.error) {
                        log.exception(event.data.error);
                    }
                };

                diffWorker.postMessage({ baseHtml: baseHtmlWithTextDirection, currentHtml });
            }
        },
        750
    );

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
