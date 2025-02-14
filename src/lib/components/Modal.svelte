<script lang="ts">
    import type { Snippet } from 'svelte';

    // Must pass either `open` or `description` as a binding
    // If you pass `open`, then it will be used as the trigger for opening and closing
    // If you pass `description`, then it will be used as the trigger. `null` hides the modal and a string shows it.

    interface Props {
        open?: boolean;
        description?: string | null;
        header?: string;
        primaryButtonText?: string | null;
        primaryButtonOnClick?: (() => Promise<void>) | (() => void);
        primaryButtonDisabled?: boolean;
        isError?: boolean;
        isTransacting?: boolean;
        children?: Snippet;
        additionalButtons?: Snippet;
        closeWhenClickOutside?: boolean;
    }

    let {
        open = $bindable(undefined),
        description = $bindable(null),
        header,
        primaryButtonText = undefined,
        primaryButtonOnClick = undefined,
        primaryButtonDisabled = false,
        isError = false,
        isTransacting = false,
        closeWhenClickOutside = false,
        children,
        additionalButtons,
    }: Props = $props();

    let dialog: HTMLDialogElement;

    const usesDescriptionForShowAndClose = open === undefined;

    $effect(() => {
        if (dialog) {
            const shouldShow = usesDescriptionForShowAndClose ? description !== null : open;
            if (shouldShow) {
                dialog.showModal();
            } else {
                dialog.close();
            }
        }
    });

    function close() {
        if (usesDescriptionForShowAndClose) {
            description = null;
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
    onclose={close}
    onkeyup={(e) => e.key === 'Escape' && close()}
    onclick={(e) => {
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
                onclick={close}>✕</button
            >
        </form>
        {#if header}
            <h3 class="w-full pb-4 text-center text-xl font-bold {isError && 'text-error'}">{header}</h3>
        {:else}
            <div class="w-full pb-4"></div>
        {/if}

        {#if description}
            <p class="py-4 text-lg {isError && 'text-error'}">
                {@html description.replaceAll('\n', '<br />')}
            </p>
        {/if}
        {#if children !== undefined}
            <div class="flex flex-col">
                {@render children?.()}
            </div>
        {/if}
        {#if primaryButtonText}
            <div class="flex w-full flex-row space-x-2 pt-4">
                {#if additionalButtons !== undefined}
                    {@render additionalButtons?.()}
                {/if}
                <div class="flex-grow"></div>
                <button
                    class="btn btn-primary"
                    onclick={handlePrimaryClick}
                    disabled={primaryButtonDisabled || isTransacting}
                >
                    {#if isTransacting}
                        <span class="loading loading-spinner"></span>
                    {:else}
                        {primaryButtonText}
                    {/if}
                </button>
                <button class="btn btn-outline btn-primary" disabled={isTransacting} onclick={close}>Cancel</button>
            </div>
        {:else}
            <div class="flex w-full flex-row space-x-2 pt-4">
                {#if additionalButtons !== undefined}
                    {@render additionalButtons?.()}
                {/if}
            </div>
        {/if}
    </div>
</dialog>
