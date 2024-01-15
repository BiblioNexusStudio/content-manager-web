<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import PencilSquareIcon from '$lib/icons/PencilSquareIcon.svelte';
    import XSquareIcon from '$lib/icons/XSquareIcon.svelte';
    import { originalValues, updatedValues, updateValues, setOriginalValues } from '$lib/stores/tiptapContent';
    import checkCircleO from 'svelte-awesome/icons/checkCircleO';
    import ban from 'svelte-awesome/icons/ban';
    import { createEventDispatcher } from 'svelte';
    import type { Language } from '$lib/types/base';

    export let displayNameText: string;
    export let typeText: string;
    export let wordCount: number | null;
    export let language: Language;
    export let isPublished: boolean;
    export let canEdit: boolean;
    const dispatch = createEventDispatcher();

    let displayNameInput: HTMLInputElement;
    setOriginalValues({ displayName: displayNameText });
    $: updateValues({ displayName: displayNameText });
    $: displayNameUpdated = $originalValues?.displayName !== $updatedValues?.displayName;

    function saveOnBlur() {
        if (displayNameUpdated) {
            dispatch('saveTitle');
        }
    }
</script>

<div class="mb-4 flex grow flex-col rounded-lg border border-base-300 bg-base-200">
    <div class="px-4 py-2 text-xl font-medium">Overview</div>
    <div class="h-full overflow-y-scroll rounded-lg bg-white p-4">
        <div class="flex flex-col">
            <div class="mb-2 flex items-center justify-between">
                <div class="flex grow items-center">
                    <div class="me-3 font-bold">Title</div>
                    <div class="grow">
                        {#if canEdit}
                            <input
                                type="text"
                                bind:this={displayNameInput}
                                bind:value={displayNameText}
                                class="input input-ghost h-6 w-full pl-0 text-right"
                                on:blur={() => saveOnBlur()}
                            />
                        {:else}
                            <div class="text-right">{displayNameText}</div>
                        {/if}
                    </div>
                </div>
                {#if canEdit}
                    <button
                        class="h-6 w-6 p-0"
                        on:click={() => {
                            if (displayNameUpdated) displayNameText = $originalValues?.displayName || '';
                            else displayNameInput.focus();
                        }}
                        ><label class="swap swap-rotate">
                            <input checked={!displayNameUpdated} type="checkbox" disabled={!displayNameUpdated} />
                            <div class="swap-on text-primary">
                                <PencilSquareIcon />
                            </div>
                            <div class="swap-off text-primary">
                                <XSquareIcon />
                            </div>
                        </label></button
                    >
                {/if}
            </div>
            <div class="mb-2 flex justify-between">
                <span class="me-4 font-bold">Language</span><span
                    >{language.englishDisplay} [{language.iso6393Code}]</span
                >
            </div>
            <div class="mb-2 flex justify-between">
                <span class="me-4 font-bold">Type</span><span>{typeText}</span>
            </div>
            {#if wordCount !== null}
                <div class="mb-2 flex justify-between">
                    <span class="me-4 font-bold">Word Count</span><span>{wordCount}</span>
                </div>
            {/if}
            <div class="flex justify-between">
                <span class="me-4 font-bold">Published</span>
                {#if isPublished}
                    <Icon data={checkCircleO} style="height: 28px; width: auto; color: #00a5e0" />
                {:else}
                    <Icon data={ban} style="height: 28px; width: auto; color: #abaeb1" />
                {/if}
            </div>
        </div>
    </div>
</div>
