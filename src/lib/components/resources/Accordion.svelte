<script>
    import { Icon } from 'svelte-awesome';
    import chevronUp from 'svelte-awesome/icons/chevronUp';
    import chevronDown from 'svelte-awesome/icons/chevronDown';

    export let title = '';
    export let closable = false;
    export let fullHeight = false;

    let isOpen = true;

    function toggleAccordion() {
        if (closable) {
            isOpen = !isOpen;
        }
    }
</script>

<div class="accordion mb-8 rounded-lg border-2 border-neutral-200 {fullHeight ? 'fullHeight overflow-y-hidden' : ''}">
    <div
        class="flex items-center justify-between p-4 {closable ? 'cursor-pointer' : ''} bg-neutral-200"
        on:click={toggleAccordion}
        on:keydown={toggleAccordion}
        tabindex="0"
        role="button"
    >
        <h3 class="font-bold">{title}</h3>
        {#if closable}
            <span>
                {#if isOpen}
                    <Icon data={chevronUp} />
                {:else}
                    <Icon data={chevronDown} />
                {/if}
            </span>
        {/if}
    </div>
    {#if isOpen}
        <div class="{fullHeight ? 'h-full' : 'max-h-40'} overflow-y-scroll p-4">
            <slot />
        </div>
    {/if}
</div>

<style>
    .fullHeight {
        height: calc(100vh - 8.5rem);
    }
</style>
