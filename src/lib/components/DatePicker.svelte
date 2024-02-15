<script lang="ts">
    export let date: string;
</script>

<div class="flex h-full w-auto items-center justify-center">
    <input type="date" bind:value={date} class="h-auto w-full rounded-md border px-4" />
</div>
