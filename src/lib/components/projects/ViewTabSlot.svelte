<script lang="ts">
    import { Permission, userCan } from '$lib/stores/auth';

    export let title: string;
</script>

<div class="flex {$userCan(Permission.ReadProjects) ? 'min-h-12' : 'min-h-8'} items-center justify-between py-2">
    <div class="font-bold">{title}</div>
    <slot />
</div>
