<script lang="ts">
    import { statusColorMap, ResourceContentStatusEnum } from '$lib/types/base';

    export let status: ResourceContentStatusEnum;

    $: statusColor = statusColorMap[status];
</script>

<div class="me-1 h-2 w-2 rounded-full" style="background-color: {statusColor};"></div>
