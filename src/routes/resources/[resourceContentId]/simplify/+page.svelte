<!--This page is a PoC and should be removed once its functionality is added to the parent page-->

<script lang="ts">
    import type { PageData } from './$types';
    import Content from '$lib/components/resources/Content.svelte';
    import { type ContentItem, MediaTypeEnum, type ResourceContent } from '$lib/types/resources';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { setOriginalValues, originalValues, updateValues, updateOriginal } from '$lib/stores/tiptapContent';
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

    export let data: PageData;

    let working = false;
    let errorMessage: string | undefined = undefined;
    let prompt =
        'Take great care to make the text as easy to understand as possible. Bible references in the text should not be altered.';
    let resourceContent: ResourceContent;
    $: aquiferizedResourceContentVersion = {
        id: 999999,
        displayName: 'a',
        contentSize: 1,
        assignedUser: null,
        content: [
            {
                stepNumber: 0,
                tiptap: '',
                thumbnailUrl: '',
                duration: 0,
                displayName: 'a',
                url: '',
            },
        ] as ContentItem[],
        isPublished: false,
        isDraft: false,
        wordCount: 0,
    };

    let versionPromise = getVersion(data.resourceContent.promise);
    async function getVersion(resourceContentPromise: Promise<ResourceContent>) {
        resourceContent = await resourceContentPromise;
        resourceContent.contentVersions.push(aquiferizedResourceContentVersion);

        setOriginalValues(resourceContent);
        return resourceContent.contentVersions.find((x) => x.id === +data.versionId!)!;
    }

    async function aquiferize() {
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
        const jsonContent = $originalValues[+data.versionId!]!.content![0]!.tiptap!;

        const html = generateHTML(jsonContent, extensions);

        const res = await postToApi<{ content: string; error: string | undefined }>(`/ai/simplify`, {
            prompt: prompt,
            content: html,
        });

        console.log(res);

        errorMessage = res?.error;

        const aquiferizedJson = generateJSON(res?.content ?? '', extensions);
        aquiferizedResourceContentVersion.content[0]!.tiptap = JSON.stringify(aquiferizedJson);
        updateValues(999999, { content: [{ tiptap: aquiferizedJson }] });
        updateOriginal(999999);

        working = false;
    }
</script>

{#await versionPromise}
    <CenteredSpinner />
{:then version}
    <div class="mx-4 my-4">
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
            <button class="btn {working ? 'btn-disabled' : 'btn-primary'} min-w-[128px]" on:click={aquiferize}
                >{working ? 'Working...' : 'Aquiferize'}</button
            >
        </div>

        {#if errorMessage}
            <div class="my-4 text-red-500">
                {errorMessage}
            </div>
        {/if}

        <div class="mt-2 grid h-fit grid-cols-2 gap-4 gap-y-8">
            <div class="col-span-1 h-fit">
                <Content
                    contentVersionId={version.id}
                    visible={true}
                    canEdit={false}
                    resourceContentVersion={version}
                    mediaType={MediaTypeEnum.text}
                />
            </div>
            <div class="col-span-1 h-fit">
                {#key aquiferizedResourceContentVersion.content}
                    <Content
                        contentVersionId={aquiferizedResourceContentVersion.id}
                        visible={true}
                        canEdit={false}
                        resourceContentVersion={aquiferizedResourceContentVersion}
                        mediaType={MediaTypeEnum.text}
                    />
                {/key}
            </div>
        </div>
    </div>
{:catch error}
    <p class="text-red-500">{error.message}</p>
{/await}
