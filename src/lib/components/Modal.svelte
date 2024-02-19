<script lang="ts">
    export let open: boolean;
    export let header: string;
    export let primaryButtonText: string | undefined = undefined;
    export let primaryButtonOnClick: (() => void) | undefined = undefined;
    export let primaryButtonDisabled = false;
    export let isError = false;
    export let description: string | undefined = undefined;

    let dialog: HTMLDialogElement;

    $: dialog ? (open ? dialog.showModal() : dialog.close()) : null;

    function close() {
        open = false;
    }

    function handlePrimaryClick() {
        primaryButtonOnClick?.();
        open = false;
    }
</script>

<dialog bind:this={dialog} class="modal" on:close={close}>
    <div class="modal-box {isError && 'bg-error'}">
        <form method="dialog">
            <button class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2" on:click={close}>✕</button>
        </form>
        <h3 class="w-full pb-4 text-center text-xl font-bold">{header}</h3>

        {#if description}
            <p class="py-4 text-lg font-medium">
                {@html description.replaceAll('\n', '<br />')}
            </p>
        {/if}
        <div class="flex flex-col">
            <slot />
        </div>
        {#if primaryButtonText}
            <div class="flex w-full flex-row justify-end space-x-2 pt-4">
                <button class="btn btn-primary" on:click={handlePrimaryClick} disabled={primaryButtonDisabled}>
                    {primaryButtonText}
                </button>
                <button class="btn btn-outline btn-primary" on:click={close}>Cancel</button>
            </div>
        {/if}
    </div>
</dialog>
