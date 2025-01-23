<script lang="ts">
    import { statusColorMap, ResourceContentStatusEnum } from '$lib/types/base';

    interface Props {
        status: ResourceContentStatusEnum;
    }

    let { status }: Props = $props();

    let statusColor = $derived(statusColorMap[status]);
</script>

<div class="me-1 h-2 w-2 rounded-full" style="background-color: {statusColor};"></div>
