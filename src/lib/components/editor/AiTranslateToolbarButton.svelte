<script lang="ts">
    import type { Editor } from '@tiptap/core';
    import { postToApi, rawPostToApi } from '$lib/utils/http-service';
    import type { ResourceContent } from '$lib/types/resources';
    import TranslateIcon from '$lib/icons/TranslateIcon.svelte';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import MachineTranslationRating from '$lib/components/MachineTranslationRating.svelte';
    import { Permission, userCan, userIsEqual, currentUser } from '$lib/stores/auth';
    import { ResourceContentStatusEnum } from '$lib/types/base';
    import type { MachineTranslationStore } from '$lib/stores/machineTranslation';
    import Modal from '$lib/components/Modal.svelte';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';
    import { generateHTML } from '@tiptap/html';
    import { extensions } from '../tiptap/extensions';
    import { getIsPageTransactingContext } from '$lib/context/is-page-transacting-context';
    import { streamAiContent } from '$lib/utils/ai-streaming-content';

    export let editor: Editor;
    export let editableDisplayNameStore: ChangeTrackingStore<string> | undefined;
    export let resourceContent: ResourceContent;
    export let isLoading: boolean;
    export let canEdit: boolean;
    export let machineTranslationStore: MachineTranslationStore;

    const canShowAnything =
        canEdit &&
        $userCan(Permission.AiTranslate) &&
        resourceContent.status === ResourceContentStatusEnum.TranslationInProgress;

    const isPageTransacting = getIsPageTransactingContext();

    let isErrorModalOpen = false;
    let isTranslating = false;
    let machineTranslation = machineTranslationStore.machineTranslation;
    $: showTranslateButton = canShowAnything && !$machineTranslation.id;
    $: showRating = canShowAnything && !showTranslateButton && $userIsEqual($machineTranslation.userId);

    const postToTranslate = async (content: string, prompt: string | null = null) => {
        return rawPostToApi('/ai/translate', {
            languageName: resourceContent.language.englishDisplay,
            languageCode: resourceContent.language.iso6393Code,
            content,
            prompt,
        });
    };

    const translateDisplayName = async () => {
        let newDisplayName = '';

        const response = await postToTranslate(
            resourceContent.displayName,
            `You receive a string and then return that string in the ${resourceContent.language.englishDisplay} language. Translate the exact string that you receive. Do not interpret it as anything other than the exact string that it is.`
        );

        await streamAiContent(response, (nextText) => {
            if (!editor.isDestroyed) {
                newDisplayName += nextText;
                $editableDisplayNameStore = newDisplayName;
            }
        });
    };

    const translateContent = async (originalHtml: string) => {
        const spanAttrs: string[] = [];
        const spanAttrRegex = /(?<=<span\s)([^>]*)(?=>)/g;

        let match;
        while ((match = spanAttrRegex.exec(originalHtml)) !== null) {
            spanAttrs.push(match[1]!.trim());
        }

        let index = 0;
        originalHtml = originalHtml.replace(spanAttrRegex, (match, p1) => {
            return match.replace(p1, `a="${index++}"`);
        });

        const response = await postToTranslate(originalHtml);

        let fullContent = '';

        isLoading = false;

        await streamAiContent(response, (nextText) => {
            if (!editor.isDestroyed) {
                fullContent += nextText;
                editor.commands.setContent(fullContent);
            }
        });

        for (let i = 0; i < spanAttrs.length; i++) {
            fullContent = fullContent.replace(`a="${i}"`, spanAttrs[i]!);
        }

        editor.commands.setContent(fullContent);
    };

    const onClick = async () => {
        const originalHtml = generateHTML(editor.getJSON(), extensions(false, undefined, false, undefined));
        const originalDisplayName = $editableDisplayNameStore;
        try {
            $isPageTransacting = true;
            isTranslating = true;
            isLoading = true;

            await translateDisplayName();
            await translateContent(originalHtml);

            // Since the translation calls take so long, the user may have navigated away from the page, and we don't
            // want to create the machine translation in that case.
            if (!editor.isDestroyed) {
                await createMachineTranslation();
            }
        } catch (e) {
            isErrorModalOpen = true;
            $editableDisplayNameStore = originalDisplayName;
            editor.commands.setContent(originalHtml);
        } finally {
            if (!editor.isDestroyed) {
                $isPageTransacting = false;
                isTranslating = false;
                isLoading = false;
            }
        }
    };

    async function createMachineTranslation() {
        const response = await postToApi<{ id: number }>(`/resources/content/machine-translation`, {
            resourceContentVersionId: resourceContent.resourceContentVersionId,
            sourceId: 1,
            content: editor.getHTML(),
        });

        machineTranslationStore.promptForRating.set(true);
        machineTranslation.update((x) => {
            return { ...x, id: response!.id, userId: $currentUser!.id };
        });
    }
</script>

{#if showTranslateButton}
    {#if isTranslating}
        <div class="flex w-[42px] justify-center">
            <div class="loading loading-infinity loading-md text-primary" />
        </div>
    {:else}
        <Tooltip
            position={{ right: '2.2rem' }}
            class="flex border-primary align-middle text-primary"
            text="Translate with AI"
        >
            <button
                data-app-insights-event-name="editor-toolbar-translate-click"
                class="btn btn-link !no-animation btn-xs !bg-base-200 text-xl !no-underline"
                disabled={$isPageTransacting}
                on:click={onClick}><TranslateIcon /></button
            >
        </Tooltip>
    {/if}
{:else if showRating}
    <div class="mx-2">
        <MachineTranslationRating {machineTranslationStore} />
    </div>
{/if}

<Modal
    header="Error"
    bind:open={isErrorModalOpen}
    isError={true}
    description="An error occurred creating the translation. Please try again. If the problem persists, please contact support."
/>
