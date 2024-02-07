<script lang="ts">
    import type { BasicUser } from '$lib/types/base';

    export let users: BasicUser[] | null;
    export let selectedUserId: string | null;
    export let disabled = false;
    export let defaultLabel: string;
    export let hideUser: BasicUser | null = null;

    $: sortedUsers = users?.sort((a, b) => a.name.localeCompare(b.name));
</script>

{#if sortedUsers}
    <select {disabled} bind:value={selectedUserId} class="select select-bordered">
        <option value={null} selected>{defaultLabel}</option>
        {#each sortedUsers as user}
            {#if user.id !== hideUser?.id}
                <option value={user.id}>{user.name}</option>
            {/if}
        {/each}
    </select>
{/if}
