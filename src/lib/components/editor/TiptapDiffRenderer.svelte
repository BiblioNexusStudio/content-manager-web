<script lang="ts">
    import { onDestroy, onMount, tick } from 'svelte';
    import type { TiptapContentItem } from '$lib/types/resources';
    import HtmlDiffWorker from '../../../workers/html-differ.ts?worker';
    import CenteredSpinner from '../CenteredSpinner.svelte';
    import { debounce } from '$lib/utils/debounce';
    import { extensions } from '../tiptap/config';
    import { log } from '$lib/logger';
    import { Editor } from 'aquifer-tiptap';
    import type { ScriptDirection } from '$lib/types/base';
    import { scrollPosition, isScrollSyncEnabled, scrollSyncSourceDiv } from '$lib/stores/scrollSync';

    export let tiptapJson: TiptapContentItem | undefined;
    export let currentTiptapJsonForDiffing: TiptapContentItem | undefined;
    export let languageScriptDirection: ScriptDirection | undefined;

    $: calculateBaseHtmlWithTextDirection(tiptapJson);
    $: debouncedGenerateDiffHtml(currentTiptapJsonForDiffing, baseHtmlWithTextDirection);

    let diffWorker: Worker | null = null;
    let diffedHtml: string | undefined;
    let currentTiptapJsonString: string | undefined;
    let previousBaseHtmlWithTextDirection: string | undefined;
    let baseHtmlWithTextDirection: string | undefined;
    let scrollSyncElement: HTMLDivElement | undefined;

    function calculateBaseHtmlWithTextDirection(tiptapJson: TiptapContentItem | undefined) {
        if (tiptapJson) {
            const original = baseHtmlWithTextDirection;
            baseHtmlWithTextDirection = generateHTMLIncludingTextDirection(tiptapJson, languageScriptDirection);
            if (original !== baseHtmlWithTextDirection) {
                diffedHtml = undefined;
            }
        }
    }

    function generateHTMLIncludingTextDirection(
        tiptapJson: TiptapContentItem,
        languageScriptDirection: ScriptDirection | undefined
    ) {
        const editor = new Editor({
            editable: false,
            extensions: extensions(false, undefined, true, languageScriptDirection),
            content: tiptapJson.tiptap,
        });
        return editor.getHTML();
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
                        setScroll($scrollPosition);
                    } else if (event.data.error) {
                        log.exception(event.data.error);
                    }
                };

                diffWorker.postMessage({ baseHtml: baseHtmlWithTextDirection, currentHtml });
            }
        },
        750
    );

    $: {
        if ($isScrollSyncEnabled && $scrollSyncSourceDiv && $scrollSyncSourceDiv !== scrollSyncElement) {
            setScroll($scrollPosition);
        }
    }

    const setScroll = (scrollPosition: number) => {
        if (scrollSyncElement) {
            const scrollHeight = scrollSyncElement.scrollHeight;
            const clientHeight = scrollSyncElement.clientHeight;

            scrollSyncElement.scrollTop = scrollPosition * (scrollHeight - clientHeight);
        }
    };

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

    onMount(async () => {
        if (scrollSyncElement) {
            scrollSyncElement.scrollTop = 0;
        }
    });

    onDestroy(() => diffWorker && diffWorker.terminate());
</script>

<div class="relative grow">
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        bind:this={scrollSyncElement}
        on:scroll={handleScroll}
        on:mouseenter={setScrollSyncElement}
        on:focus={setScrollSyncElement}
        class="absolute bottom-0 left-0 right-0 top-0 overflow-y-scroll rounded-md border border-base-300 bg-white"
    >
        {#if diffedHtml}
            <div
                dir={languageScriptDirection?.toLowerCase()}
                class="prose prose-sm m-4 max-w-none text-black sm:prose-base focus:outline-none"
            >
                {@html diffedHtml}
            </div>
        {:else}
            <CenteredSpinner />
        {/if}
    </div>
</div>
