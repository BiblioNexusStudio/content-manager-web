<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import arrowCircleLeft from 'svelte-awesome/icons/arrowCircleLeft';
    import arrowCircleRight from 'svelte-awesome/icons/arrowCircleRight';
    import SingleItemEditor from '$lib/components/editor/SingleItemEditor.svelte';
    import type { ResourceContent, Snapshot, Version, TiptapContentItem } from '$lib/types/resources';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';
    import TiptapRenderer from '$lib/components/editor/TiptapRenderer.svelte';
    import { onMount } from 'svelte';
    import TiptapDiffRenderer from '$lib/components/editor/TiptapDiffRenderer.svelte';
    import type { CommentStores } from '$lib/stores/comments';

    export let editableContentStore: ChangeTrackingStore<TiptapContentItem[]>;
    export let canEdit: boolean;
    export let canComment: boolean;
    export let canAiTranslate: boolean;
    export let wordCountsByStep: number[] | undefined;
    export let resourceContent: ResourceContent;
    export let snapshotOrVersion: Snapshot | Version | undefined;
    export let isComparingToCurrent: boolean;
    export let selectedStepNumber: number | undefined;
    export let commentStores: CommentStores;

    onMount(() => (selectedStepNumber ||= 1));

    $: content = (snapshotOrVersion?.content ?? resourceContent.content) as TiptapContentItem[];
    $: numberOfSteps = content.length;
    $: stepNavigation = numberOfSteps > 1;
    $: isShowingSnapshotOrVersion = !!snapshotOrVersion?.content;

    const headings = [
        {
            step: 1,
            heading: 'Hear and Heart',
        },
        {
            step: 2,
            heading: 'Setting the Stage',
        },
        {
            step: 3,
            heading: 'Defining the Scenes',
        },
        {
            step: 4,
            heading: 'Embodying the Text',
        },
        {
            step: 5,
            heading: 'Filling the Gaps',
        },
        {
            step: 6,
            heading: 'Speaking the Word',
        },
    ];

    function handleStep(direction: 'forward' | 'backward') {
        if (selectedStepNumber === 1 && direction === 'backward') {
            return;
        }

        if (selectedStepNumber === numberOfSteps && direction === 'forward') {
            return;
        }

        if (direction === 'forward') {
            selectedStepNumber! += 1;
        } else {
            selectedStepNumber! -= 1;
        }
    }
</script>

{#if selectedStepNumber}
    <div class="flex h-full flex-col space-y-4">
        {#if stepNavigation}
            <div class="mx-12">
                <div class="mt-2 flex items-center justify-between">
                    {#if selectedStepNumber !== 1}
                        <button on:click={() => handleStep('backward')}>
                            <Icon data={arrowCircleLeft} scale={1.5} />
                        </button>
                    {/if}

                    <h2 class="mx-auto text-xl font-bold">{headings[selectedStepNumber - 1]?.heading}</h2>

                    {#if selectedStepNumber !== numberOfSteps}
                        <button on:click={() => handleStep('forward')}>
                            <Icon data={arrowCircleRight} scale={1.5} />
                        </button>
                    {/if}
                </div>
            </div>
        {/if}

        {#each new Array(numberOfSteps) as _, index (index)}
            <div class="flex h-full flex-col {index === selectedStepNumber - 1 ? '' : 'hidden'}">
                {#if (canEdit || canComment) && wordCountsByStep && editableContentStore}
                    <SingleItemEditor
                        bind:wordCountsByStep
                        {editableContentStore}
                        itemIndex={index}
                        {canEdit}
                        {canComment}
                        {canAiTranslate}
                        {commentStores}
                        {resourceContent}
                    />
                {:else if isComparingToCurrent}
                    <TiptapDiffRenderer
                        currentTiptapJsonForDiffing={$editableContentStore[index]}
                        tiptapJson={content[index]}
                        {commentStores}
                    />
                {:else}
                    <div class="flex h-full flex-col">
                        {#if !isShowingSnapshotOrVersion}
                            <div class="h-[2.625rem]" />
                        {/if}
                        <TiptapRenderer
                            tiptapJson={content[index]}
                            canEdit={false}
                            canComment={false}
                            {commentStores}
                        />
                    </div>
                {/if}
            </div>
        {/each}
    </div>
{/if}
