<script lang="ts">
    import Select from '$lib/components/Select.svelte';
    import type { BasicUser } from '$lib/types/base';

    export let users: BasicUser[] | null;
    export let selectedUserId: number | null;
    export let disabled = false;
    export let defaultLabel: string;
    export let hideUser: BasicUser | null = null;

    $: filteredUserOptions =
        users?.filter((u) => u.id !== hideUser?.id).map((u) => ({ value: u.id, label: u.name })) ?? [];
</script>

<Select
    bind:value={selectedUserId}
    isNumber={true}
    {disabled}
    options={[
        {
            label: defaultLabel,
            value: null,
        },
        ...filteredUserOptions,
    ]}
    class="select select-bordered"
/>
