<script lang="ts">
    export let href: string;
    export let style = '';
</script>

<td {style} class="h-[1px] p-0 {$$props.class}"
    ><a class="flex px-4 py-3" {href}>
        <slot />
    </a></td
>
