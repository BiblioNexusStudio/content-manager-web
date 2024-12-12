<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        class?: string;
        href: string;
        style?: string;
        children: Snippet<[]>;
    }

    let { class: className, href, style, children }: Props = $props();
</script>

<td {style} class="h-[1px] p-0 {className}"
    ><a class="flex px-4 py-3" {href}>
        {@render children()}
    </a></td
>
