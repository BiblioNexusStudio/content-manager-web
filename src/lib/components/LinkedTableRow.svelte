<script lang="ts">
    export let href: string;
    export let cellValues: (string | number | [string | number, string])[];
</script>

<tr class="hover">
    {#each cellValues as cellValue, i (i)}
        <td class="h-[1px] p-0"
            ><a class="block px-4 py-3" {href}>
                {#if typeof cellValue === 'object'}
                    <span class={cellValue[1]}>{cellValue[0]}</span>
                {:else}
                    {cellValue}
                {/if}
            </a></td
        >
    {/each}
</tr>
