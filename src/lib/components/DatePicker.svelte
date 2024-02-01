<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let date: string;

    const dispatch = createEventDispatcher();

    function handleDateChange(event: Event) {
        date = (event.target as HTMLInputElement).value;
        dispatch('dateChange', date);
    }
</script>

<div class="flex h-full w-auto items-center justify-center">
    <input
        type="date"
        bind:value={date}
        on:change={handleDateChange}
        class="h-auto w-full rounded-md border px-4 py-2"
    />
</div>
