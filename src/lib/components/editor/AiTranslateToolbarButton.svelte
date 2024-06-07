<script lang="ts">
    import type { Editor } from '@tiptap/core';
    import { postToApi } from '$lib/utils/http-service';
    import type { ResourceContent } from '$lib/types/resources';
    import TranslateIcon from '$lib/icons/TranslateIcon.svelte';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import MachineTranslationRating from '$lib/components/MachineTranslationRating.svelte';
    import { Permission, userCan, userIsEqual, currentUser } from '$lib/stores/auth';
    import { ResourceContentStatusEnum } from '$lib/types/base';
    import type { MachineTranslationStore } from '$lib/stores/machineTranslation';

    export let editor: Editor;
    export let resourceContent: ResourceContent;
    export let isLoading: boolean;
    export let canEdit: boolean;
    export let machineTranslationStore: MachineTranslationStore;

    let errorModal: HTMLDialogElement;
    const canShowAnything =
        canEdit &&
        $userCan(Permission.AiTranslate) &&
        resourceContent.status === ResourceContentStatusEnum.TranslationInProgress;

    let machineTranslation = machineTranslationStore.machineTranslation;
    $: showTranslateButton = canShowAnything && !$machineTranslation.id;
    $: showRating = canShowAnything && !showTranslateButton && $userIsEqual($machineTranslation.userId);

    const onClick = async () => {
        isLoading = true;
        editor.setEditable(false);

        let html = editor.getHTML();
        let regex = /(<h\d\s|<p\s)/;
        let splits = html.split(regex);
        let chunks: string[] = [];
        for (let i = 1; i < splits.length; i = i + 2) {
            chunks.push(splits[i]! + splits[i + 1]!);
        }

        const promises = [];
        for (const key in chunks) {
            const promise = postToApi('/ai/translate', {
                languageName: resourceContent.language.englishDisplay,
                content: chunks[key],
            });

            promises.push(promise);
        }

        try {
            const responses = (await Promise.all(promises)) as unknown as { content: string }[];
            const response = responses.map((x) => x!.content).join('');

            // Since the translate calls take so long, the user may have navigated away from the page and we don't want
            // to create the machine translation in that case.
            if (!editor.isDestroyed) {
                editor.commands.setContent(response);
                await createMachineTranslation();
            }
        } catch (e) {
            console.log(e);
            errorModal.showModal();
        } finally {
            if (!editor.isDestroyed) {
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
    <Tooltip
        position={{ right: '2.2rem' }}
        class="flex border-primary align-middle text-primary"
        text="Translate with AI"
    >
        <button
            data-app-insights-event-name="editor-toolbar-translate-click"
            class="btn btn-link !no-animation btn-xs !bg-base-200 text-xl !no-underline"
            on:click={onClick}
            disabled={isLoading}><TranslateIcon /></button
        >
    </Tooltip>
{:else if showRating}
    <div class="mx-2">
        <MachineTranslationRating {machineTranslationStore} />
    </div>
{/if}

<dialog bind:this={errorModal} class="modal">
    <div class="modal-box">
        <div class="w-full pb-4 text-center text-lg font-bold text-error">
            An error occurred creating the translation. Please try again. If the problem persists, please contact
            support.
        </div>
        <div class="modal-action">
            <form method="dialog">
                <button class="btn btn-primary">Close</button>
            </form>
        </div>
    </div>
</dialog>
