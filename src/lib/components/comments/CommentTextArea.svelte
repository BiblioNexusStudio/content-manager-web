<script lang="ts">
    import { onMount } from 'svelte';

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

<textarea bind:this={element} bind:value {disabled} class="textarea textarea-bordered my-2 w-full resize-none shadow-sm"
></textarea>
