<script lang="ts">
    import type { Snippet } from 'svelte';
    interface Props {
        class?: string;
        style?: string;
        children: Snippet;
    }

    let { style = '', class: className, children }: Props = $props();
</script>

<td {style} class="h-[1px] p-0 {className}"
    ><div class="flex px-4 py-3">
        {@render children()}
    </div></td
>
