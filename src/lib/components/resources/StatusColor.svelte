<script lang="ts">
    import { statusColorMap, ResourceContentStatusEnum } from '$lib/types/base';

    export let status: ResourceContentStatusEnum;

    $: statusColor = statusColorMap[status];
</script>

<div class="me-1 h-3 w-3 rounded-full" style="background-color: {statusColor};"></div>
