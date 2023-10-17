<script lang="ts">
    import { goto } from '$app/navigation';
    import { Icon } from 'svelte-awesome';
    import arrowLeft from 'svelte-awesome/icons/arrowLeft';
</script>

<button class="mr-4 w-12 text-2xl" on:click={() => goto('/resources')}>
    <Icon data={arrowLeft} scale={2} />
</button>
