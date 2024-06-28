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
    export let machineTranslationStore: MachineTranslationStore;

    const canShowAnything =
        canEdit &&
        $userCan(Permission.AiTranslate) &&
        resourceContent.status === ResourceContentStatusEnum.TranslationInProgress;

    let isErrorModalOpen = false;
    let machineTranslation = machineTranslationStore.machineTranslation;
    $: showTranslateButton = canShowAnything && !$machineTranslation.id;
    $: showRating = canShowAnything && !showTranslateButton && $userIsEqual($machineTranslation.userId);

    const sleep = async (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
    };

    const onClick = async () => {
        isLoading = true;
        editor.setEditable(false);

        const html = generateHTML(editor.getJSON(), extensions(false, undefined, false, undefined));
        // const regex = /(<h\d|<p)/;
        // const splits = html.split(regex);
        // const chunks: string[] = [];
        // for (let i = 1; i < splits.length; i = i + 2) {
        //     chunks.push(splits[i]! + splits[i + 1]!);
        // }
        //
        // const promises = [
        //     postToApi('/ai/translate', {
        //         languageName: resourceContent.language.englishDisplay,
        //         content: prepareDisplayName(resourceContent.displayName),
        //     }),
        // ];
        // for (const key in chunks) {
        //     const promise = postToApi('/ai/translate', {
        //         languageName: resourceContent.language.englishDisplay,
        //         content: chunks[key],
        //     });
        //
        //     promises.push(promise);
        // }

        try {
            const response = await rawPostToApi('/ai/translate', {
                languageName: resourceContent.language.englishDisplay,
                content: html,
            });

            const reader = response!.body!.getReader();
            const decoder = new TextDecoder('utf-8');

            isLoading = false;

            let fullContent = '';
            let lastFinishReason: string | null | undefined = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const decodedValue = decoder.decode(value, { stream: true });
                const results = decodedValue.split('data: ');

                for (let result of results) {
                    result = result?.trim();
                    if (!result || result === '') continue;

                    if (result === '[DONE]') {
                        continue;
                    }

                    console.log(result);
                    const json = JSON.parse(result.trim()) as unknown as {
                        choices: { delta: { content: string }; finish_reason: string | null }[];
                    };
                    console.log(json.choices[0]?.delta.content);

                    if (lastFinishReason === 'stop' && fullContent.endsWith('.')) {
                        fullContent += ' ';
                    }

                    if (json.choices[0]?.delta.content) {
                        fullContent += json.choices[0].delta.content;
                        editor.commands.setContent(fullContent);
                    }

                    lastFinishReason = json.choices[0]?.finish_reason;
                }

                // result = result.replace('data: ', '');
                // console.log(result);
                // const json = JSON.parse(result); // as unknown as { choices: { delta: { content: string } } }[];
                // console.log(json);
                //
                // console.log(json[0]?.choices.delta.content); // Process the chunked data as needed
            }

            //const responseContent = response as unknown as { content: string };

            //const responses = (await Promise.all(promises)) as unknown as { content: string }[];
            //const newDisplayName = extractDisplayName(responses.shift());
            //const response = responses.map((x) => x!.content).join('');

            // Since the translate calls take so long, the user may have navigated away from the page and we don't want
            // to create the machine translation in that case.
            if (!editor.isDestroyed) {
                // if (newDisplayName && editableDisplayNameStore) {
                //     $editableDisplayNameStore = newDisplayName;
                // }
                //editor.commands.setContent(responseContent.content);
                //await createMachineTranslation();
            }
        } catch (e) {
            console.log(e);
            //isErrorModalOpen = true;
        } finally {
            if (!editor.isDestroyed) {
                editor.setEditable(true);
                isLoading = false;
            }
        }
    };

    // in order to make the display name as close to the header that is often in the content, wrap it in an H1
    function prepareDisplayName(displayName: string) {
        return `<h1>${displayName}</h1>`;
    }

    function extractDisplayName(response: { content: string } | undefined) {
        if (response?.content) {
            const match = response.content.match(/<h1>(.*?)<\/h1>/);
            if (match && match[1]) {
                return match[1];
            }
        }
        return undefined;
    }

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

<Modal
    header="Error"
    bind:open={isErrorModalOpen}
    isError={true}
    description="An error occurred creating the translation. Please try again. If the problem persists, please contact support."
/>
