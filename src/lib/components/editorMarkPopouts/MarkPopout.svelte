<script lang="ts">
    export let markSpan: HTMLElement | null;
    export let container: HTMLDivElement | undefined;
    export let show = false;

    let windowInnerWidth = 0;
    let windowInnerHeight = 0;

    $: commentSpanRect = (windowInnerWidth || windowInnerHeight) && markSpan?.getBoundingClientRect();
    $: heightAtBottom = (commentSpanRect && windowInnerHeight - commentSpanRect.bottom - 10) ?? 0;
    $: parentHeight = container?.getBoundingClientRect()?.height ?? 0;
</script>

<svelte:window bind:innerWidth={windowInnerWidth} bind:innerHeight={windowInnerHeight} />

{#if show && commentSpanRect}
    {#key commentSpanRect}
        <div
            bind:this={container}
            class="absolute z-50 flex w-[300px] flex-col overflow-y-auto rounded-lg border-2 bg-white shadow"
            style="left: {commentSpanRect.left -
                (commentSpanRect.left + 300 > windowInnerWidth ? 300 - commentSpanRect.width : 0)}px; {heightAtBottom <
            300
                ? `top:${commentSpanRect.top - parentHeight - 5}px; max-height:400px;`
                : `top:${commentSpanRect.bottom}px; max-height:${heightAtBottom}px;`}"
        >
            <slot />
        </div>
    {/key}
{/if}
