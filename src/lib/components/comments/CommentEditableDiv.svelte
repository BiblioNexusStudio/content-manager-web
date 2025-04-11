<script lang="ts">
    import { page } from '$app/state';
    import { onMount } from 'svelte';
    import { mentions, parseCommentDbTextIntoDisplayHtml } from '$lib/components/mentions/mentions.svelte.ts';
    import { Permission, userCan } from '$lib/stores/auth';

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

    let element: HTMLDivElement | undefined = $state();
    let isCommunityUser = $derived($userCan(Permission.CreateCommunityContent));
</script>

<!-- due to depending on the binding for contenteditable, we have to use this awful if check -->
{#if disabled}
    <div class="relative">
        <div
            bind:this={element}
            contenteditable="false"
            class="textarea textarea-bordered my-2 w-full resize-none overflow-y-auto p-2 shadow"
            style="min-height: 100px; white-space: pre-wrap;"
            role="textbox"
            aria-multiline="true"
        >
            {@html parseCommentDbTextIntoDisplayHtml(value, page.data.users)}
        </div>
    </div>
{:else if isCommunityUser}
    <div class="relative">
        <div
            bind:this={element}
            bind:innerHTML={value}
            contenteditable="true"
            class="textarea textarea-bordered my-2 w-full resize-none overflow-y-auto p-2 shadow"
            style="min-height: 100px; white-space: pre-wrap;"
            role="textbox"
            aria-multiline="true"
        >
            {@html parseCommentDbTextIntoDisplayHtml(value, page.data.users)}
        </div>
    </div>
{:else}
    <div class="relative">
        <div
            bind:this={element}
            bind:innerHTML={value}
            contenteditable="true"
            class="textarea textarea-bordered my-2 w-full resize-none overflow-y-auto p-2 shadow"
            style="min-height: 100px; white-space: pre-wrap;"
            use:mentions={{ dbValue: value, userList: page.data.users, currentUser: page.data.currentUser }}
            role="textbox"
            aria-multiline="true"
        >
            {@html parseCommentDbTextIntoDisplayHtml(value, page.data.users)}
        </div>
    </div>
{/if}
