<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import Accordion from './Accordion.svelte';
    import PencilSquareIcon from '$lib/icons/PencilSquareIcon.svelte';
    import XSquareIcon from '$lib/icons/XSquareIcon.svelte';
    import checkCircleO from 'svelte-awesome/icons/checkCircleO';
    import ban from 'svelte-awesome/icons/ban';
    import { originalValues, updatedValues, updateValues, setOriginalValues } from '$lib/stores/tiptapContent';
    import { canEdit } from '$lib/stores/auth';

    export let labelText: string;
    export let typeText: string;
    export let isPublished: boolean;

    let labelInput: HTMLInputElement;
    setOriginalValues({ label: labelText });
    $: updateValues({ label: labelText });
    $: labelUpdated = $originalValues?.label !== $updatedValues?.label;
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
                            bind:this={labelInput}
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
                        else labelInput.focus();
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
            <span class="me-4 font-bold">Type</span><span>{typeText}</span>
        </div>
        <div class="mb-4 flex items-center justify-between">
            <span class="me-4 font-bold">Published</span>
            <span>
                {#if isPublished}
                    <Icon data={checkCircleO} style="height: 26px; width: auto; color: #01a4e0" />
                {:else}
                    <Icon data={ban} style="height: 26px; width: auto; color: #bababa" />
                {/if}
            </span>
        </div>
    </div>
</Accordion>
