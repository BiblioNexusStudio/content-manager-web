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

    export let editor: Editor;
    export let editableDisplayNameStore: ChangeTrackingStore<string> | undefined;
    export let resourceContent: ResourceContent;
    export let isLoading: boolean;
    export let canEdit: boolean;
    export let aiTranslateInProgress: boolean;
    export let machineTranslationStore: MachineTranslationStore;

    const canShowAnything =
        canEdit &&
        $userCan(Permission.AiTranslate) &&
        resourceContent.status === ResourceContentStatusEnum.TranslationInProgress;

    let isErrorModalOpen = false;
    let machineTranslation = machineTranslationStore.machineTranslation;
    $: showTranslateButton = canShowAnything && !$machineTranslation.id;
    $: showRating = canShowAnything && !showTranslateButton && $userIsEqual($machineTranslation.userId);

    const postToTranslate = async (content: string, prompt: string | null = null) => {
        return rawPostToApi('/ai/translate', {
            languageName: resourceContent.language.englishDisplay,
            content,
            prompt,
        });
    };

    const getDecodedResults = (decoder: TextDecoder, value: Uint8Array | undefined) => {
        const decodedValue = decoder.decode(value, { stream: true });
        return decodedValue.split('data: ');
    };

    // It's possible for a stream to have an incomplete chunk, and the next chunk will have the rest.
    // If the parse fails, then join the previous result with the next one to complete the json.
    let incompleteResult = '';
    const parseChoiceFromResult = (result: string) => {
        try {
            if (incompleteResult !== '') {
                result = incompleteResult + result;
            }

            const json = JSON.parse(result) as unknown as {
                choices: { delta: { content: string }; finish_reason: string | null }[];
            };

            incompleteResult = '';
            return json.choices[0];
        } catch (e) {
            incompleteResult += result;
        }
    };

    const translateDisplayName = async (decoder: TextDecoder) => {
        let newDisplayName = '';

        const response = await postToTranslate(
            resourceContent.displayName,
            `Translate to ${resourceContent.language.englishDisplay}`
        );

        const reader = response!.body!.getReader();
        while (!editor.isDestroyed) {
            const { done, value } = await reader.read();
            if (done) break;

            const results = getDecodedResults(decoder, value);
            for (let result of results) {
                result = result?.trim();
                if (!result || result === '') continue;

                if (result === '[DONE]') {
                    continue;
                }

                const choice = parseChoiceFromResult(result);
                if (choice?.delta.content) {
                    newDisplayName += choice.delta.content;
                    $editableDisplayNameStore = newDisplayName;
                }
            }
        }
    };

    const translateContent = async (decoder: TextDecoder, originalHtml: string) => {
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
        const reader = response!.body!.getReader();

        isLoading = false;

        let fullContent = '';

        while (!editor.isDestroyed) {
            const { done, value } = await reader.read();
            if (done) break;

            const results = getDecodedResults(decoder, value);
            for (let result of results) {
                result = result?.trim();
                if (!result || result === '') continue;

                if (result === '[DONE]') {
                    continue;
                }

                const choice = parseChoiceFromResult(result);

                if (choice?.delta.content) {
                    fullContent += choice.delta.content;
                    editor.commands.setContent(fullContent);
                }
            }
        }

        for (let i = 0; i < spanAttrs.length; i++) {
            fullContent = fullContent.replace(`a="${i}"`, spanAttrs[i]!);
        }

        editor.commands.setContent(fullContent);
    };

    const onClick = async () => {
        const originalHtml = generateHTML(editor.getJSON(), extensions(false, undefined, false, undefined));
        const originalDisplayName = $editableDisplayNameStore;
        try {
            aiTranslateInProgress = true;
            isLoading = true;
            editor.setEditable(false);

            const decoder = new TextDecoder('utf-8');
            await translateDisplayName(decoder);
            await translateContent(decoder, originalHtml);

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
                aiTranslateInProgress = false;
                editor.setEditable(true);
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
    {#if aiTranslateInProgress}
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
                on:click={onClick}
                disabled={aiTranslateInProgress}><TranslateIcon /></button
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
