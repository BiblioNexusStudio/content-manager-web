<script lang="ts">
    export const focus = () => {
        // Doesn't consistently work without the timeout. The element is there, so something is stealing focus.
        setTimeout(() => {
            element.focus();
        }, 100);
    };

    export let value: string;
    export let disabled: boolean;

    let element: HTMLTextAreaElement;
</script>

<textarea bind:this={element} bind:value {disabled} class="textarea textarea-bordered my-2 w-full resize-none shadow"
></textarea>
