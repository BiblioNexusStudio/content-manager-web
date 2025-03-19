<script lang="ts">
    import Select from '$lib/components/Select.svelte';

    interface Props {
        selectedReason: string | null;
    }

    let { selectedReason = $bindable() }: Props = $props();

    let reasons = [
        'Not applicable in target language',
        'Resource content is wrong',
        'Resource content not relevant',
        'Resource to be split/replaced',
        "Verse doesn't exist in target language",
        'Other',
    ];

    let options = reasons.map((r) => ({ value: r, label: r }));
</script>

<Select
    bind:value={selectedReason}
    class="select select-bordered w-full"
    options={[
        {
            label: 'Select reason',
            value: null,
        },
        ...options,
    ]}
/>
