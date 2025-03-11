<script lang="ts">
    interface Props {
        markSpan: HTMLElement | null;
        container?: HTMLDivElement | undefined;
        show?: boolean;
        children?: import('svelte').Snippet;
    }

    let { markSpan = $bindable(null), container = $bindable(), show = $bindable(false), children }: Props = $props();

    let windowInnerWidth = $state(0);
    let windowInnerHeight = $state(0);

    let spanRect = $derived((windowInnerWidth || windowInnerHeight) && markSpan?.getBoundingClientRect());
    let heightAtBottom = $derived((spanRect && windowInnerHeight - spanRect.bottom - 10) ?? 0);
    let parentHeight = $derived(container?.getBoundingClientRect()?.height ?? 0);
</script>

<svelte:window bind:innerWidth={windowInnerWidth} bind:innerHeight={windowInnerHeight} />

{#if show && spanRect}
    {#key spanRect}
        <div
            bind:this={container}
            class="fixed z-50 flex w-[300px] flex-col overflow-y-auto rounded-lg border-2 bg-white shadow-sm"
            style="left: {spanRect.left -
                (spanRect.left + 300 > windowInnerWidth ? 300 - spanRect.width : 0)}px; {heightAtBottom < 400
                ? `top:${spanRect.top - parentHeight - 5}px; max-height:400px;`
                : `top:${spanRect.bottom}px; max-height:${heightAtBottom}px;`}"
        >
            {@render children?.()}
        </div>
    {/key}
{/if}
