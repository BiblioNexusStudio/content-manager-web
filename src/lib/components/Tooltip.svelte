<script lang="ts">
    export let text: string | null;
    export let position: { top?: string; left?: string; bottom?: string; right?: string };
</script>

{#if text}
    <div class="tooltip-container relative flex items-center">
        <div class="peer flex items-center">
            <slot />
        </div>

        <div
            style="top: {position.top ?? 'none'}; left: {position.left ?? 'none'}; bottom: {position.bottom ??
                'none'}; right:
        {position.right ?? 'none'};"
            class="tooltip absolute z-[99] hidden whitespace-nowrap rounded-xl border-2 bg-white px-2 text-sm font-bold transition peer-hover:flex
        {$$props.class}"
        >
            {text}
        </div>
    </div>
{:else}
    <slot />
{/if}
