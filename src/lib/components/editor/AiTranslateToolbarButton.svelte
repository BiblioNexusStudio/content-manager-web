<script lang="ts">
    import type { Editor } from '@tiptap/core';
    import { patchToApi, postToApi } from '$lib/utils/http-service';
    import type { ResourceContent } from '$lib/types/resources';
    import TranslateIcon from '$lib/icons/TranslateIcon.svelte';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import { Permission, userCan, userIsEqual } from '$lib/stores/auth';
    import { ResourceContentStatusEnum } from '$lib/types/base';
    import StarRating from '$lib/components/StarRating.svelte';

    export let editor: Editor;
    export let resourceContent: ResourceContent;
    export let isLoading: boolean;
    export let canEdit: boolean;

    interface RatingData {
        userRating: number;
        improveClarity: boolean;
        improveConsistency: boolean;
        improveTone: boolean;
    }

    const canShowAnything =
        canEdit &&
        $userCan(Permission.AiTranslate) &&
        resourceContent.status === ResourceContentStatusEnum.TranslationInProgress;

    let machineTranslation = resourceContent.machineTranslation;
    let machineTranslationId = machineTranslation?.id;
    let showTranslateButton = canShowAnything && !machineTranslationId;
    let showRating = canShowAnything && $userIsEqual(machineTranslation?.userId);

    let ratingData: RatingData = {
        userRating: machineTranslation?.userRating ?? 0,
        improveClarity: machineTranslation?.improveClarity ?? false,
        improveConsistency: machineTranslation?.improveConsistency ?? false,
        improveTone: machineTranslation?.improveTone ?? false,
    };

    console.log(ratingData.userRating);

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

        const responses = (await Promise.all(promises)) as unknown as { content: string }[];
        const response = responses.map((x) => x!.content).join('');

        editor.commands.setContent(response);
        editor.setEditable(true);
        isLoading = false;
        await createMachineTranslation();
    };

    async function createMachineTranslation() {
        const response = await postToApi<{ id: number }>(`/resources/content/machine-translation`, {
            resourceContentVersionId: resourceContent.resourceContentVersionId,
            sourceId: 1,
            content: editor.getHTML(),
        });

        machineTranslationId = response?.id;
        showTranslateButton = false;
        showRating = true;
    }

    async function updateMachineTranslation() {
        await patchToApi(`/resources/content/machine-translation/${machineTranslationId}`, { ...ratingData });
    }

    const onRating = async (newRating: number) => {
        if (ratingData.userRating === newRating) return;

        ratingData.userRating = newRating;
        await updateMachineTranslation();
    };
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
    <StarRating callback={onRating} rating={ratingData.userRating} />
{/if}
