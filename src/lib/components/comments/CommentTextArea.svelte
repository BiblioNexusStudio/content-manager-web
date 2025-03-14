<script lang="ts">
    import { onMount } from 'svelte';
    import { mentions } from '$lib/components/mentions/mentions.svelte.ts';

    onMount(() => {
        // Something steals focus with create comment, so need a slight delay.
        setTimeout(() => {
            element?.focus();
        }, 100);
    });

    interface Props {
        value: string;
        disabled: boolean;
    }

    let { value = $bindable(), disabled }: Props = $props();

    let element: HTMLTextAreaElement;
</script>

<div class="relative">
    <textarea
        bind:this={element}
        bind:value
        {disabled}
        class="textarea textarea-bordered my-2 w-full resize-none shadow"
        use:mentions
        placeholder="Type @ to mention a user"
    ></textarea>
</div>
