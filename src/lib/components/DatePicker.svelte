<script lang="ts">
    interface Props {
        date: string;
        callback?: ((date: string) => void) | undefined;
        earliestDate?: string | undefined;
        latestDate?: string | undefined;
    }

    let {
        date = $bindable(),
        callback = undefined,
        earliestDate = undefined,
        latestDate = undefined,
    }: Props = $props();

    let internalDate: string = $state(date);

    $effect(() => {
        internalDate = date;
    });

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
        oninput={update}
        min={earliestDate}
        max={latestDate}
        class="h-auto w-full rounded-md border px-4 py-2"
    />
</div>
