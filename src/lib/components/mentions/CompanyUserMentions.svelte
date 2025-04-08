<script lang="ts">
    import MarkPopout from '$lib/components/editorMarkPopouts/MarkPopout.svelte';
    import type { User } from '$lib/types/base';
    import { mentions, type MentionsProps } from './mentions.svelte';

    let { show, inputElement, userList, selectedUserIndex }: MentionsProps = $props();
    let ulElement: HTMLUListElement | null = $state(null);

    function handleKeydown(event: KeyboardEvent, user: User) {
        if (event.key === 'Enter') {
            event.preventDefault();
            mentions.selectUser(user);
        }
    }

    // Ensure the selected item is visible when selectedUserIndex changes
    $effect(() => {
        if (ulElement && userList.length > 0 && selectedUserIndex >= 0 && selectedUserIndex < userList.length) {
            setTimeout(() => {
                const items = ulElement?.querySelectorAll('li');
                if (items && items[selectedUserIndex]) {
                    items[selectedUserIndex].scrollIntoView({ block: 'center' });
                }
            }, 0);
        }
    });
</script>

<!-- window that appears near input node -->
<MarkPopout bind:show bind:markSpan={inputElement}>
    <ul role="listbox" class="m-4 flex max-h-60 flex-col space-y-2 overflow-y-auto py-2" bind:this={ulElement}>
        {#each userList as user, index (user.id)}
            <li
                role="option"
                aria-selected={index === selectedUserIndex}
                tabindex="0"
                onclick={() => mentions.selectUser(user)}
                onkeydown={(event) => handleKeydown(event, user)}
                class="hover:bg-primary-content cursor-pointer rounded-lg p-2"
                class:bg-base-100={index !== selectedUserIndex}
                class:bg-primary-content={index === selectedUserIndex}
                class:text-primary={index === selectedUserIndex}
            >
                {user.name}
            </li>
        {/each}
    </ul>
</MarkPopout>
