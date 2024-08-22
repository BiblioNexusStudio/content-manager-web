<script lang="ts">
    export let date: string;
    export let callback: ((date: string) => void) | undefined = undefined;
    export let earliestDate: string | undefined = undefined;
    export let latestDate: string | undefined = undefined;

    $: internalDate = date;

    function update() {
        if (callback) {
            callback(internalDate);
        } else {
            date = internalDate;
        }
    }
</script>

<div class="flex h-full w-auto items-center justify-center">
    <input
        type="date"
        bind:value={internalDate}
        on:blur={update}
        min={earliestDate}
        max={latestDate}
        class="h-auto w-full rounded-md border px-4 py-2"
    />
</div>
