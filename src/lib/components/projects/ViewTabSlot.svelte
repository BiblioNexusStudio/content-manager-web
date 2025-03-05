<script lang="ts">
    import { Permission, userCan } from '$lib/stores/auth';
    import type { Snippet } from 'svelte';

    interface Props {
        title: string;
        children?: Snippet;
        titleClassProps?: string;
    }

    let { title, children, titleClassProps }: Props = $props();
</script>

<div
    class="flex {$userCan(Permission.ReadProjects) ? 'min-h-12' : 'min-h-8'} {titleClassProps ??
        ''} items-center justify-between py-2"
>
    <div class="font-bold">{title}</div>
    {@render children?.()}
</div>
