<script lang="ts">
    import Select from '$lib/components/Select.svelte';
    import type { BasicUser } from '$lib/types/base';

    interface Props {
        users: BasicUser[] | null;
        selectedUserId: number | null;
        disabled?: boolean;
        defaultLabel: string;
        hideUser?: BasicUser | null;
    }

    let {
        users,
        selectedUserId = $bindable(),
        disabled = $bindable(false),
        defaultLabel,
        hideUser = null,
    }: Props = $props();

    let filteredUserOptions = $derived(
        users?.filter((u) => u.id !== hideUser?.id).map((u) => ({ value: u.id, label: u.name })) ?? []
    );
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
    class="select select-bordered w-full"
/>
