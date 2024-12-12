<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Position {
        top?: string;
        left?: string;
        bottom?: string;
        right?: string;
    }

    interface Props {
        text: string | null;
        position: Position;
        class?: string;
        children: Snippet<[]>;
    }

    let { text, position, class: className, children }: Props = $props();
</script>

{#if text}
    <div class="tooltip-container relative flex items-center">
        <div class="peer flex items-center">
            {@render children()}
        </div>

        <div
            style="top: {position.top ?? 'none'}; left: {position.left ?? 'none'}; bottom: {position.bottom ??
                'none'}; right:
        {position.right ?? 'none'};"
            class="tooltip absolute z-[99] hidden whitespace-nowrap rounded-xl border-2 bg-white px-2 text-sm font-bold transition peer-hover:flex
        {className ?? ''}"
        >
            {text}
        </div>
    </div>
{:else}
    {@render children()}
{/if}
