<script lang="ts">
    export let title: string;
</script>

<div class="flex min-h-[64px] items-center justify-between py-2">
    <div class="font-bold">{title}</div>
    <slot />
</div>
