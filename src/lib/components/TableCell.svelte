<script lang="ts">
    import type { Snippet } from 'svelte';
    interface Props {
        class?: string;
        style?: string;
        stopPropagation?: boolean;
        children: Snippet;
    }

    function stopPropagationWhenClicked(e: Event) {
        if (stopPropagation) {
            e.stopPropagation();
        }
    }

    let { style = '', class: className, stopPropagation = false, children }: Props = $props();
</script>

<td {style} onclick={(e) => stopPropagationWhenClicked(e)} class="h-[1px] p-0 {className}"
    ><div class="flex px-4 py-3">
        {@render children()}
    </div></td
>
