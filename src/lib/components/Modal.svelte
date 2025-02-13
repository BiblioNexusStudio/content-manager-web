<script lang="ts">
    // Must pass either `open` or `description` as a binding
    // If you pass `open`, then it will be used as the trigger for opening and closing
    // If you pass `description`, then it will be used as the trigger. `undefined` hides the modal and a string shows it.

    export let open: boolean | undefined = undefined;
    export let description: string | undefined = undefined;
    export let header = '';
    export let primaryButtonText: string | undefined | null = undefined;
    export let primaryButtonOnClick: (() => Promise<void>) | (() => void) | undefined = undefined;
    export let primaryButtonDisabled = false;
    export let isError = false;
    export let isTransacting = false;
    export let closeWhenClickOutside = false;

    let dialog: HTMLDialogElement;

    const usesDescriptionForShowAndClose = open === undefined;

    $: {
        if (dialog) {
            const shouldShow = usesDescriptionForShowAndClose ? description !== undefined : open;
            if (shouldShow) {
                dialog.showModal();
            } else {
                dialog.close();
            }
        }
    }

    function close() {
        if (usesDescriptionForShowAndClose) {
            description = undefined;
        } else {
            open = false;
        }
    }

    function handlePrimaryClick() {
        const primaryClickResult = primaryButtonOnClick?.();
        if (primaryClickResult && 'then' in primaryClickResult) {
            primaryClickResult.then(close);
        } else {
            close();
        }
    }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
    bind:this={dialog}
    class="modal"
    on:close={close}
    on:keyup={(e) => e.key === 'Escape' && close()}
    on:click={(e) => {
        if (closeWhenClickOutside && e.target === dialog) {
            close();
        }
    }}
>
    <div class="modal-box">
        <form method="dialog">
            <button
                class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
                disabled={isTransacting}
                on:click={close}>✕</button
            >
        </form>
        <h3 class="w-full pb-4 text-center text-xl font-bold {isError && 'text-error'}">{header}</h3>

        {#if description}
            <p class="py-4 text-lg {isError && 'text-error'}">
                {@html description.replaceAll('\n', '<br />')}
            </p>
        {/if}
        <div class="flex flex-col">
            <slot />
        </div>
        {#if primaryButtonText}
            <div class="flex w-full flex-row space-x-2 pt-4">
                <slot name="additional-buttons" />
                <div class="flex-grow"></div>
                <button
                    class="btn btn-primary"
                    on:click={handlePrimaryClick}
                    disabled={primaryButtonDisabled || isTransacting}
                >
                    {#if isTransacting}
                        <span class="loading loading-spinner"></span>
                    {:else}
                        {primaryButtonText}
                    {/if}
                </button>
                <button class="btn btn-outline btn-primary" disabled={isTransacting} on:click={close}>Cancel</button>
            </div>
        {:else}
            <div class="flex w-full flex-row space-x-2 pt-4">
                <slot name="additional-buttons" />
            </div>
        {/if}
    </div>
</dialog>
