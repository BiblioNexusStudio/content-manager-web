<script lang="ts">
    export let markSpan: HTMLElement | null;
    export let container: HTMLDivElement | undefined = undefined;
    export let show = false;

    let windowInnerWidth = 0;
    let windowInnerHeight = 0;

    $: spanRect = (windowInnerWidth || windowInnerHeight) && markSpan?.getBoundingClientRect();
    $: heightAtBottom = (spanRect && windowInnerHeight - spanRect.bottom - 10) ?? 0;
    $: parentHeight = container?.getBoundingClientRect()?.height ?? 0;
</script>

<svelte:window bind:innerWidth={windowInnerWidth} bind:innerHeight={windowInnerHeight} />

{#if show && spanRect}
    {#key spanRect}
        <div
            bind:this={container}
            class="fixed z-50 flex w-[300px] flex-col overflow-y-auto rounded-lg border-2 bg-white shadow"
            style="left: {spanRect.left -
                (spanRect.left + 300 > windowInnerWidth ? 300 - spanRect.width : 0)}px; {heightAtBottom < 400
                ? `top:${spanRect.top - parentHeight - 5}px; max-height:400px;`
                : `top:${spanRect.bottom}px; max-height:${heightAtBottom}px;`}"
        >
            <slot />
        </div>
    {/key}
{/if}
