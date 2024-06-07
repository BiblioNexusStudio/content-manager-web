<script lang="ts">
    export let open: boolean;
    export let header: string;
    export let primaryButtonText: string | undefined = undefined;
    export let primaryButtonOnClick: (() => Promise<void>) | (() => void) | undefined = undefined;
    export let primaryButtonDisabled = false;
    export let isError = false;
    export let description: string | undefined = undefined;
    export let isTransacting = false;

    let dialog: HTMLDialogElement;

    $: dialog ? (open ? dialog.showModal() : dialog.close()) : null;

    function close() {
        open = false;
    }

    function handlePrimaryClick() {
        const primaryClickResult = primaryButtonOnClick?.();
        if (primaryClickResult && 'then' in primaryClickResult) {
            primaryClickResult.then(() => (open = false));
        } else {
            open = false;
        }
    }
</script>

<dialog bind:this={dialog} class="modal" on:close={close}>
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
            <div class="flex w-full flex-row justify-end space-x-2 pt-4">
                <button
                    class="btn btn-primary"
                    on:click={handlePrimaryClick}
                    disabled={primaryButtonDisabled || isTransacting}
                >
                    {#if isTransacting}
                        <span class="loading loading-spinner" />
                    {:else}
                        {primaryButtonText}
                    {/if}
                </button>
                <button class="btn btn-outline btn-primary" disabled={isTransacting} on:click={close}>Cancel</button>
            </div>
        {/if}
    </div>
</dialog>
