<script lang="ts">
    import Accordion from './Accordion.svelte';
    import PencilSquareIcon from '$lib/icons/PencilSquareIcon.svelte';
    import XSquareIcon from '$lib/icons/XSquareIcon.svelte';
    import { originalValues, updatedValues, updateLabel, setOriginalLabel } from '$lib/stores/tiptapContent';
    import { canEdit } from '$lib/stores/auth';

    export let labelText: string;
    export let typeText: string;

    setOriginalLabel(labelText);
    $: updateLabel(labelText);
    $: labelUpdated = $originalValues?.label !== $updatedValues?.label;
</script>

<Accordion title="Overview" closable={false}>
    <div class="flex flex-col">
        <div class="mb-4 flex items-center justify-between">
            <div class="flex grow items-center">
                <div class="mr-3 font-bold">Label</div>
                <div class="mr-4 grow">
                    {#if $canEdit}
                        <input
                            type="text"
                            id="labelInput"
                            bind:value={labelText}
                            class="input input-ghost h-6 w-full pl-0"
                        />
                    {:else}
                        {labelText}
                    {/if}
                </div>
            </div>
            {#if $canEdit}
                <button
                    class="h-6 w-6 p-0"
                    on:click={() => {
                        if (labelUpdated) labelText = $originalValues?.label || '';
                        else document?.getElementById('labelInput')?.focus();
                    }}
                    ><label class="swap swap-rotate">
                        <input checked={!labelUpdated} type="checkbox" disabled={!labelUpdated} />
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
            <span class="mr-4 font-bold">Type</span><span>{typeText}</span>
        </div>
    </div>
</Accordion>
