<script lang="ts">
    import { onDestroy, tick } from 'svelte';
    import type { TiptapContentItem } from '$lib/types/resources';
    import HtmlDiffWorker from '../../../workers/html-differ.ts?worker';
    import CenteredSpinner from '../CenteredSpinner.svelte';
    import { debounce } from '$lib/utils/debounce';
    import { extensions } from '../tiptap/config';
    import { log } from '$lib/logger';
    import { Editor } from 'aquifer-tiptap';
    import type { ScriptDirection } from '$lib/types/base';
    import { scrollSync } from '$lib/stores/scrollSync.svelte.ts';

    interface TipTapDiffRendererProps {
        tiptapJson: TiptapContentItem | undefined;
        currentTiptapJsonForDiffing: TiptapContentItem | undefined;
        languageScriptDirection: ScriptDirection | undefined;
    }

    let { tiptapJson, currentTiptapJsonForDiffing, languageScriptDirection }: TipTapDiffRendererProps = $props();

    let diffWorker: Worker | null = null;
    let diffedHtml: string | undefined = $state();
    let currentTiptapJsonString: string | undefined;
    let previousBaseHtmlWithTextDirection: string | undefined;
    let baseHtmlWithTextDirection: string | undefined = $state();
    let lastProcessedTiptapJson: TiptapContentItem | undefined;

    $effect(() => {
        // Skip if we've already processed this exact tiptapJson
        if (tiptapJson === lastProcessedTiptapJson) return;

        lastProcessedTiptapJson = tiptapJson;

        if (tiptapJson) {
            const newBaseHtml = generateHTMLIncludingTextDirection(tiptapJson, languageScriptDirection);
            if (newBaseHtml !== baseHtmlWithTextDirection) {
                baseHtmlWithTextDirection = newBaseHtml;
                diffedHtml = undefined;
                debouncedGenerateDiffHtml(currentTiptapJsonForDiffing, newBaseHtml);
            }
        }
    });

    $effect(() => {
        debouncedGenerateDiffHtml(currentTiptapJsonForDiffing, baseHtmlWithTextDirection);
    });

    function generateHTMLIncludingTextDirection(
        tiptapJson: TiptapContentItem,
        languageScriptDirection: ScriptDirection | undefined
    ) {
        const editor = new Editor({
            editable: false,
            extensions: extensions(false, undefined, true, languageScriptDirection, false),
            content: tiptapJson.tiptap,
        });
        return editor.getHTML();
    }

    const debouncedGenerateDiffHtml = debounce(
        async (
            currentTiptapJsonForDiffing: TiptapContentItem | undefined,
            baseHtmlWithTextDirection: string | undefined
            // eslint-disable-next-line
        ) => {
            if (
                currentTiptapJsonForDiffing &&
                baseHtmlWithTextDirection &&
                (currentTiptapJsonString !== JSON.stringify(currentTiptapJsonForDiffing.tiptap) ||
                    previousBaseHtmlWithTextDirection !== baseHtmlWithTextDirection)
            ) {
                const currentHtml = generateHTMLIncludingTextDirection(
                    currentTiptapJsonForDiffing,
                    languageScriptDirection
                );
                currentTiptapJsonString = JSON.stringify(currentTiptapJsonForDiffing.tiptap);
                previousBaseHtmlWithTextDirection = baseHtmlWithTextDirection;

                if (diffWorker) {
                    diffWorker.terminate();
                }

                // Spin up a web worker since the HTML diffing is CPU intensive and causes UI stutters if on the main thread.
                diffWorker = new HtmlDiffWorker();
                diffWorker.onmessage = async (event) => {
                    if (event.data.success) {
                        diffedHtml = event.data.success;
                        await tick();
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
    <div
        use:scrollSync
        class="border-base-300 absolute top-0 right-0 bottom-0 left-0 overflow-y-scroll rounded-md border bg-white"
    >
        {#if diffedHtml}
            <div
                dir={languageScriptDirection}
                class="prose prose-sm sm:prose-base m-4 max-w-none text-black focus:outline-hidden"
            >
                {@html diffedHtml}
            </div>
        {:else}
            <CenteredSpinner />
        {/if}
    </div>
</div>
