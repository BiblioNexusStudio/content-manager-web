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
    import { getFromApi } from '$lib/utils/http-service';
    import type { Snapshot, TiptapContentItem } from '$lib/types/resources';

    export let itemIndex: number;
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
    let expiredRetranslationModalOpen = false;
    let isTranslating = false;
    let machineTranslations = machineTranslationStore.machineTranslations;
    let isRetranslateModalOpen = false;
    let retranslateReason = '';
    $: machineTranslation = $machineTranslations.get(itemIndex);
    $: showTranslateButton = canShowAnything && !machineTranslation?.id;
    $: showRating = canShowAnything && !showTranslateButton && $userIsEqual(machineTranslation?.userId);
    $: translatedLessThan1HourAgo = resourceContent.machineTranslations.some(
        (mt) => mt.contentIndex === itemIndex && isLessThanOneHourAgo(mt.created ?? '')
    );
    $: retranslationReasonIsPresent = resourceContent.machineTranslations.some(
        (mt) => mt.hadRetranslation && mt.contentIndex === itemIndex
    );

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

    const executeTranslation = async (retranslating = false) => {
        let content = editor.getJSON();

        if (retranslating) {
            const localSnapshot = resourceContent.snapshots
                .sort((a, b) => a.created.localeCompare(b.created))
                .find((s) => s.id);

            if (!localSnapshot || !isLessThanOneHourAgo(localSnapshot.created)) {
                translatedLessThan1HourAgo = false;
                retranslationReasonIsPresent = true;
                expiredRetranslationModalOpen = true;
                return;
            }

            const snapshot = await getFromApi<Snapshot>(`/resources/content/snapshots/${localSnapshot.id}`);

            if (snapshot) {
                content = snapshot.content as TiptapContentItem[];
                content = content[itemIndex].tiptap;
            }
        }

        const originalHtml = generateHTML(content, extensions(false, undefined, false, undefined));
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

            if (!retranslating) {
                translatedLessThan1HourAgo = true;
                retranslationReasonIsPresent = false;
            } else {
                translatedLessThan1HourAgo = false;
                retranslationReasonIsPresent = true;
            }
        }
    };

    const openRetranslateModal = () => {
        isRetranslateModalOpen = true;
    };

    const onRetranslateClick = () => {
        isRetranslateModalOpen = false;
        executeTranslation(true);
    };

    async function createMachineTranslation() {
        const response = await postToApi<{ id: number }>(`/resources/content/machine-translation`, {
            resourceContentVersionId: resourceContent.resourceContentVersionId,
            sourceId: 1,
            contentIndex: itemIndex,
            displayName: $editableDisplayNameStore,
            content: editor.getHTML(),
            retranslationReason: retranslateReason || null,
        });

        machineTranslationStore.machineTranslations.update((machineTranslations) =>
            machineTranslations.set(itemIndex, {
                id: response!.id,
                userId: $currentUser!.id,
                contentIndex: itemIndex,
                userRating: 0,
                improveClarity: false,
                improveConsistency: false,
                improveTone: false,
            })
        );
        machineTranslationStore.promptForRating.set(true);
    }

    function isLessThanOneHourAgo(datetime: string): boolean {
        if (datetime) {
            const inputDate = new Date(datetime);
            const currentDate = new Date();

            const differenceInMilliseconds = currentDate.getTime() - inputDate.getTime();

            const differenceInMinutes = differenceInMilliseconds / (1000 * 60);

            //this needs to be changed back after qa testing.
            //return differenceInMinutes <= 60;
            return differenceInMinutes <= 5;
        }
        return false;
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
                on:click={() => executeTranslation()}><TranslateIcon /></button
            >
        </Tooltip>
    {/if}
{:else if showRating}
    <div class="mx-2 flex items-center">
        <MachineTranslationRating {itemIndex} {machineTranslationStore} />
    </div>
    {#if translatedLessThan1HourAgo && !retranslationReasonIsPresent}
        {#if isTranslating}
            <div class="flex w-[42px] justify-center">
                <div class="loading loading-infinity loading-md text-primary" />
            </div>
        {:else}
            <Tooltip
                position={{ right: '2.2rem' }}
                class="flex border-primary align-middle text-primary"
                text="Retranslate with AI"
            >
                <button
                    data-app-insights-event-name="editor-toolbar-retranslate-click"
                    class="btn btn-link !no-animation btn-xs !bg-base-200 text-xl !no-underline"
                    disabled={$isPageTransacting}
                    on:click={openRetranslateModal}><TranslateIcon /></button
                >
            </Tooltip>
        {/if}
    {/if}
{/if}
<Modal
    header="Error"
    bind:open={isErrorModalOpen}
    isError={true}
    description="An error occurred creating the translation. Please try again. If the problem persists, please contact support."
/>

<Modal
    header="Error"
    bind:open={expiredRetranslationModalOpen}
    isError={true}
    description="The retranslation period has expired after one hour."
/>

<Modal
    header="Retranslate"
    bind:open={isRetranslateModalOpen}
    primaryButtonText="Retranslate"
    primaryButtonOnClick={onRetranslateClick}
    primaryButtonDisabled={retranslateReason.length < 1}
>
    <div class="mb-4">
        A resource can only be retranslated once. Any edits or comments on this page will be lost. Please enter the
        reason you are retranslating this resource.
    </div>
    <textarea class="mb-4 h-32 w-full rounded-lg border p-2" bind:value={retranslateReason} maxlength="200" />
</Modal>
