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
        secondLineText?: string;
        position: Position;
        class?: string;
        children: Snippet<[]>;
    }

    let { text, secondLineText, position, class: className, children }: Props = $props();
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
            class="tooltip absolute z-99 hidden rounded-xl border-2 bg-white px-2 text-sm font-bold whitespace-nowrap transition peer-hover:flex
        {className ?? ''}"
        >
            {#if secondLineText}
                <div class="flex flex-col">
                    <div>{text}</div>
                    <div>{secondLineText}</div>
                </div>
            {:else}
                {text}
            {/if}
        </div>
    </div>
{:else}
    {@render children()}
{/if}
