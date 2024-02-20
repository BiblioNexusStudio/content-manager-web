<script lang="ts">
    export let date: string;
    export let callback: (date: string) => void;
</script>

<div class="flex h-full w-auto items-center justify-center">
    <input
        type="date"
        bind:value={date}
        on:input={() => callback(date)}
        class="h-auto w-full rounded-md border px-4 py-2"
    />
</div>
