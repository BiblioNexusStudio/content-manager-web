<script lang="ts">
    export const focus = () => {
        element.focus();
    };

    export let value: string;
    export let disabled: boolean;

    let element: HTMLTextAreaElement;
</script>

<textarea bind:this={element} bind:value {disabled} class="textarea textarea-bordered my-2 w-full resize-none shadow"
></textarea>
