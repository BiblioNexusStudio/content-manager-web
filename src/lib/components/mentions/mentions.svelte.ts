import { mount, unmount } from 'svelte';
import CompanyUserMenions from './CompanyUserMenions.svelte';

/**
 * Svelte action for handling '@' user mentions in text inputs
 * Svelte action that detects '@' mentions in text inputs and textareas
 *
 * @param node - The DOM node (input or textarea)
 * @param params - Configuration parameters maybe use if we need to pass the user list
 * @returns Svelte action object
 */
export function mentions(node: HTMLInputElement | HTMLTextAreaElement) {
    // Add event listeners
    node.addEventListener('input', handleInput);

    // Also trigger on keyup to catch deletions and other non-input events
    node.addEventListener('keyup', handleInput);

    // initialize the mentions window adding CompanyUserMentions.svelte to the page
    const mentionsWindowProps = $state({
        show: false,
        inputElement: node,
        mentionText: '',
    });

    const mentionsWindow = mount(CompanyUserMenions, {
        target: document.body,
        props: mentionsWindowProps,
    });

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement;
        const value = target.value;
        const cursorPosition = target.selectionStart || 0;
        const textBeforeCursor = value.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (isValidMentionStart(textBeforeCursor, lastAtIndex)) {
            mentionsWindowProps.show = true;
        }

        if (mentionsWindowProps.show) {
            // Extract the mention text (everything after the '@' up to the cursor)
            const mentionText = textBeforeCursor.substring(lastAtIndex + 1);

            // Only trigger if there's text after the '@'
            if (mentionText.length > 0) {
                mentionsWindowProps.mentionText = mentionText;
                if (!mentionText.includes(' ')) {
                    mentionsWindowProps.show = false;
                    return; // ? just return or destroy?
                }
            }
        }
    }

    function isValidMentionStart(text: string, lastAtIndex: number) {
        return lastAtIndex === 0 || text[lastAtIndex - 1] === ' ';
    }

    return {
        destroy() {
            node.removeEventListener('input', handleInput);
            node.removeEventListener('keyup', handleInput);
            unmount(mentionsWindow);
        },
    };
}
