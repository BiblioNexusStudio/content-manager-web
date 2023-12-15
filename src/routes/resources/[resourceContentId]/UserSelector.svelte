<script lang="ts">
    import type { User } from '$lib/types/base';

    export let users: User[] | null;
    export let selectedUserId: string | null;
    export let disabled = false;
    export let defaultLabel: string;
    export let hideUser: User | null = null;
</script>

{#if users}
    <select {disabled} bind:value={selectedUserId} class="select select-bordered">
        <option value={null} selected>{defaultLabel}</option>
        {#each users as user}
            {#if user.id !== hideUser?.id}
                <option value={user.id}>{user.name}</option>
            {/if}
        {/each}
    </select>
{/if}
