<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import arrowCircleLeft from 'svelte-awesome/icons/arrowCircleLeft';
    import arrowCircleRight from 'svelte-awesome/icons/arrowCircleRight';
    import SingleItemEditor from '$lib/components/editor/SingleItemEditor.svelte';
    import type { ResourceContent, Snapshot, Version, TiptapContentItem } from '$lib/types/resources';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';
    import { onMount } from 'svelte';
    import TiptapDiffRenderer from '$lib/components/editor/TiptapDiffRenderer.svelte';
    import type { CommentStores } from '$lib/stores/comments';
    import SingleItemDisplay from '$lib/components/editor/SingleItemDisplay.svelte';

    interface TextProps {
        editableContentStore: ChangeTrackingStore<TiptapContentItem[]>;
        canEdit: boolean;
        canComment: boolean;
        wordCountsByStep: number[] | undefined;
        characterCountsByStep: number[];
        resourceContent: ResourceContent;
        snapshotOrVersion: Snapshot | Version | undefined;
        sidebarIsOpen: boolean;
        selectedStepNumber: number | undefined;
        commentStores: CommentStores;
        blurOnPendingAiTranslate?: boolean;
        isSourceContentArea?: boolean;
    }

    let {
        editableContentStore,
        canEdit,
        canComment,
        wordCountsByStep = $bindable(undefined),
        characterCountsByStep = $bindable([]),
        resourceContent,
        snapshotOrVersion,
        sidebarIsOpen,
        selectedStepNumber = $bindable(),
        commentStores,
        blurOnPendingAiTranslate = false,
        isSourceContentArea = false,
    }: TextProps = $props();

    let isComparingToCurrent: boolean = $state(false);

    onMount(() => (selectedStepNumber ||= 1));

    let content = $derived((snapshotOrVersion?.content ?? resourceContent.content) as TiptapContentItem[]);
    let numberOfSteps = $derived(content.length);
    let stepNavigation = $derived(numberOfSteps > 1);
    let isShowingSnapshotOrVersion = $derived(!!snapshotOrVersion?.content);

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
                        <button onclick={() => handleStep('backward')}>
                            <Icon data={arrowCircleLeft} scale={1.5} />
                        </button>
                    {/if}

                    <h2 class="mx-auto text-xl font-bold">{headings[selectedStepNumber - 1]?.heading}</h2>

                    {#if selectedStepNumber !== numberOfSteps}
                        <button onclick={() => handleStep('forward')}>
                            <Icon data={arrowCircleRight} scale={1.5} />
                        </button>
                    {/if}
                </div>
            </div>
        {/if}

        {#if sidebarIsOpen && snapshotOrVersion !== undefined}
            <div class="flex h-6 w-full flex-row items-center">
                <div class="overflow-hidden text-ellipsis whitespace-nowrap text-lg">
                    {snapshotOrVersion?.displayName}
                </div>
                <div class="grow"></div>
                <div class="text-lg">
                    <label class="label cursor-pointer py-0">
                        <input
                            type="checkbox"
                            bind:checked={isComparingToCurrent}
                            data-app-insights-event-name="resource-differences-toggled-{isComparingToCurrent
                                ? 'off'
                                : 'on'}"
                            class="checkbox no-animation checkbox-sm me-2"
                        />
                        <span class="label-text text-xs">Differences</span>
                    </label>
                </div>
            </div>
        {/if}

        {#each new Array(numberOfSteps) as _, index (index)}
            <div class="flex h-full flex-col" class:hidden={index !== selectedStepNumber - 1}>
                {#if (canEdit || canComment) && wordCountsByStep && editableContentStore}
                    <SingleItemEditor
                        bind:wordCountsByStep
                        bind:characterCountsByStep
                        {editableContentStore}
                        itemIndex={index}
                        {canEdit}
                        {canComment}
                        {commentStores}
                        {resourceContent}
                        {blurOnPendingAiTranslate}
                        {isSourceContentArea}
                    />
                {:else if isComparingToCurrent}
                    <TiptapDiffRenderer
                        languageScriptDirection={resourceContent.language.scriptDirection}
                        currentTiptapJsonForDiffing={$editableContentStore[index]}
                        tiptapJson={content[index]}
                    />
                {:else}
                    <div class="flex h-full flex-col">
                        {#if !isShowingSnapshotOrVersion}
                            <div class="h-[2.625rem]"></div>
                        {/if}
                        <SingleItemDisplay
                            language={resourceContent.language}
                            bind:wordCountsByStep
                            bind:characterCountsByStep
                            itemIndex={index}
                            canEdit={false}
                            canComment={false}
                            {commentStores}
                            tiptapJson={content[index]}
                            {isSourceContentArea}
                        />
                    </div>
                {/if}
            </div>
        {/each}
    </div>
{/if}
