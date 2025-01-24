<script lang="ts">
    interface Props {
        message: string;
    }

    let { message }: Props = $props();
</script>

<div class="mb-2 whitespace-nowrap">
    {message}
</div>
