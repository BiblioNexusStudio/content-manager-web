<!--This page is a PoC and should be removed once its functionality is added to the parent page-->

<script lang="ts">
    import type { PageData } from './$types';
    import type { TiptapContentItem, ResourceContent } from '$lib/types/resources';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { postToApi } from '$lib/utils/http-service';
    import { generateHTML, generateJSON } from '@tiptap/html';
    import StarterKit from '@tiptap/starter-kit';
    import Image from '@tiptap/extension-image';
    import Link from '@tiptap/extension-link';
    import Underline from '@tiptap/extension-underline';
    import Highlight from '@tiptap/extension-highlight';
    import Subscript from '@tiptap/extension-subscript';
    import Superscript from '@tiptap/extension-superscript';
    import TextStyle from '@tiptap/extension-text-style';
    import CharacterCount from '@tiptap/extension-character-count';
    import * as customMarks from '$lib/components/tiptap/customMarks';
    import TextDirection from 'tiptap-text-direction';
    import TiptapRenderer from '$lib/components/editor/TiptapRenderer.svelte';

    export let data: PageData;

    let working = false;
    let errorMessage: string | undefined = undefined;
    let prompt =
        'Take great care to make the text as easy to understand as possible. Bible references in the text should not be altered.';

    let aquiferizedVersion: TiptapContentItem | undefined;

    function originalTiptapContentFromResourceContent(resourceContent: ResourceContent) {
        return (resourceContent.content as TiptapContentItem[] | undefined)?.[0];
    }

    async function aquiferize(originalTiptapContent: TiptapContentItem | undefined) {
        if (originalTiptapContent) {
            working = true;

            const extensions = [
                StarterKit,
                Image,
                Link.configure({
                    openOnClick: false,
                }),
                Underline,
                Highlight,
                Subscript,
                Superscript,
                TextStyle,
                CharacterCount.configure({}),
                customMarks.bibleReferenceMark,
                customMarks.resourceReferenceMark,
                TextDirection.configure({
                    types: ['heading', 'paragraph', 'orderedList', 'bulletList', 'listItem'],
                }),
            ];

            const html = generateHTML(originalTiptapContent.tiptap, extensions);

            const res = await postToApi<{ content: string; error: string | undefined }>(`/ai/simplify`, {
                prompt: prompt,
                content: html,
            });

            errorMessage = res?.error;

            const aquiferizedJson = generateJSON(res?.content ?? '', extensions);

            aquiferizedVersion = { tiptap: aquiferizedJson };

            working = false;
        }
    }
</script>

{#await data.resourceContent.promise}
    <CenteredSpinner />
{:then resourceContent}
    {@const originalTiptapContent = originalTiptapContentFromResourceContent(resourceContent)}
    <div class="flex h-full flex-col overflow-y-hidden px-4 py-4">
        <div class="grid grid-cols-2 gap-4 gap-y-8">
            <div class="col-span-1">
                <p>
                    The prompt acts as an instruction to the system about how it should behave. We will send HTML
                    content to the LLM. As such, we will always include the following at the beginning of the prompt:
                    "You receive HTML and then return the HTML with a simplified version of the text therein. Never
                    change the formatting of the HTML elements or attributes. For example, if text has an &lt;em&gt; tag
                    around it, that tag should stay with the text even if it is simplified or moved within the text." We
                    will break up the content into chunks of paragraphs. If an error occurs for a chunk, it will return
                    the original content. We will indicate on the page if some error occurred.
                </p>
            </div>
            <div class="col-span-1">
                <textarea
                    class="textarea textarea-bordered textarea-primary textarea-lg min-h-[128px] w-full"
                    bind:value={prompt}
                ></textarea>
            </div>
        </div>

        <div class="mt-8">
            <button
                class="btn {working ? 'btn-disabled' : 'btn-primary'} min-w-[128px]"
                on:click={() => aquiferize(originalTiptapContent)}>{working ? 'Working...' : 'Aquiferize'}</button
            >
        </div>

        {#if errorMessage}
            <div class="my-4 text-red-500">
                {errorMessage}
            </div>
        {/if}

        <div class="mt-2 flex grow flex-row space-x-4">
            <div class="flex grow flex-col">
                <TiptapRenderer tiptapJson={originalTiptapContent} canEdit={false} canComment={false} />
            </div>
            <div class="flex grow flex-col">
                {#key JSON.stringify(aquiferizedVersion)}
                    <TiptapRenderer tiptapJson={aquiferizedVersion} canEdit={false} canComment={false} />
                {/key}
            </div>
        </div>
    </div>
{:catch error}
    <p class="text-red-500">{error.message}</p>
{/await}
