<script lang="ts">
    interface Props {
        hasRole?: boolean;
    }
    let { hasRole = false }: Props = $props();
</script>

<td><div class="flex justify-center">{hasRole ? 'X' : ''}</div></td>
