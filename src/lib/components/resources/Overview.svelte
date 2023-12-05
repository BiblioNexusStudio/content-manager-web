<script lang="ts">
    import Accordion from './Accordion.svelte';
    import PencilSquareIcon from '$lib/icons/PencilSquareIcon.svelte';
    import XSquareIcon from '$lib/icons/XSquareIcon.svelte';
    import { originalValues, updatedValues, updateValues, setOriginalValues } from '$lib/stores/tiptapContent';
    import { canEdit } from '$lib/stores/auth';

    export let displayNameText: string;
    export let typeText: string;

    let displayNameInput: HTMLInputElement;
    setOriginalValues({ displayName: displayNameText });
    $: updateValues({ displayName: displayNameText });
    $: displayNameUpdated = $originalValues?.displayName !== $updatedValues?.displayName;
</script>

<Accordion title="Overview" closable={true}>
    <div class="flex flex-col">
        <div class="mb-4 flex items-center justify-between">
            <div class="flex grow items-center">
                <div class="me-3 font-bold">Label</div>
                <div class="me-4 grow">
                    {#if $canEdit}
                        <input
                            type="text"
                            bind:this={displayNameInput}
                            bind:value={displayNameText}
                            class="input input-ghost h-6 w-full pl-0"
                        />
                    {:else}
                        {displayNameText}
                    {/if}
                </div>
            </div>
            {#if $canEdit}
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
        <div class="mb-4">
            <span class="me-4 font-bold">Type</span><span>{typeText}</span>
        </div>
    </div>
</Accordion>
