<script lang="ts">
    import Accordion from './Accordion.svelte';
    import { Icon } from 'svelte-awesome';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import { ResourceStatusEnum } from '$lib/types/resources';
    import { setOriginalValues, updateValues } from '$lib/stores/tiptapContent';
    import { convertToReadableSize } from '$lib/utils/conversions';
    import { canEdit } from '$lib/stores/auth';

    export let translationStatus: ResourceStatusEnum;
    export let size: number;
    export let hasAudio: boolean;

    setOriginalValues({ status: translationStatus });
    $: updateValues({ status: translationStatus });

    const translationStatusOptions = [
        { value: ResourceStatusEnum.AquiferizeNotStarted, name: 'Aquiferize - Not Started' },
        { value: ResourceStatusEnum.AquiferizeInProgress, name: 'Aquiferize - In Progress' },
        { value: ResourceStatusEnum.Complete, name: 'Complete' },
        { value: ResourceStatusEnum.AquiferizeInReview, name: 'Aquiferize - In Review' },
        { value: ResourceStatusEnum.TranslateNotStarted, name: 'Translate - Not Started' },
        { value: ResourceStatusEnum.TranslateDrafting, name: 'Translate - Drafting' },
        { value: ResourceStatusEnum.TranslateEditing, name: 'Translate - Editing' },
        { value: ResourceStatusEnum.TranslateReviewing, name: 'Translate - Reviewing' },
        { value: ResourceStatusEnum.OnHold, name: 'On Hold' },
    ] as { value: ResourceStatusEnum; name: string }[];
</script>

<Accordion title="Details" closable={true}>
    <div class="flex w-full justify-between">
        <div class="flex w-full flex-col">
            <div class="mb-4 flex w-full items-center {$canEdit ? 'justify-between' : ''}">
                <div class="me-2 font-bold">Translation Status</div>
                {#if $canEdit}
                    <select bind:value={translationStatus} class="select select-ghost select-sm me-2 max-w-xs">
                        {#each translationStatusOptions as status}
                            <option value={status.value}>{status.name}</option>
                        {/each}
                    </select>
                {:else}
                    {translationStatusOptions.find((x) => x.value === translationStatus)?.name}
                {/if}
            </div>
            <div class="mb-4">
                <span class="me-2 font-bold">Size</span><span>{convertToReadableSize(size)}</span>
            </div>
        </div>
        {#if hasAudio}
            <div class="flex flex-col">
                <div class="mb-4">
                    <Icon data={volumeUp} scale={2} />
                </div>
                <div class="mb-4">Yes</div>
            </div>
        {/if}
    </div>
</Accordion>
