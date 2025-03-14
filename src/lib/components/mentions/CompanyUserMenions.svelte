<script lang="ts">
    import MarkPopout from '$lib/components/editorMarkPopouts/MarkPopout.svelte';

    interface MentionsProps {
        show: boolean;
        inputElement: HTMLInputElement | HTMLTextAreaElement;
        mentionText: string;
    }

    let { show, inputElement, mentionText }: MentionsProps = $props();
    /*
    function selectUser(userId: string, userName: string) {
        if (mentionPosition && element) {
            // Replace the mention text with the selected user
            const beforeMention = value.substring(0, mentionPosition.start);
            const afterMention = value.substring(mentionPosition.end);
            
            // Insert the user mention
            value = `${beforeMention}@${userName} ${afterMention}`;
            
            // Reset the mention state
            activeMention = null;
            mentionPosition = null;
            
            // Focus back on the textarea
            setTimeout(() => {
                element?.focus();
                // Set cursor position after the inserted mention
                const newPosition = beforeMention.length + userName.length + 2; // +2 for @ and space
                element.setSelectionRange(newPosition, newPosition);
            }, 0);
        }
    }*/

    // todo: onMount, ensure we have list of company users
    // todo: 'esc' to close
</script>

<!-- window that appears near input node -->
<!-- ? can use MarkPopout component ? -->
<MarkPopout bind:show bind:markSpan={inputElement}>
    <div class="m-4 flex flex-col justify-center space-y-2">
        {mentionText}
    </div>
</MarkPopout>
