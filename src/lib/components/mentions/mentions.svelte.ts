import { mount, unmount } from 'svelte';
import CompanyUserMentions from './CompanyUserMentions.svelte';
import type { User } from '$lib/types/base';

type UserMentionAction = {
    (
        el: HTMLDivElement,
        params: { dbValue: string; userList: User[]; currentUser: User }
    ): { destroy: () => void } | undefined;
    selectUser: (user: User) => void;
};

interface Mention {
    start: number;
    end: number;
    text: string;
}

export interface MentionsProps {
    show: boolean;
    inputElement: HTMLDivElement | null;
    userList: User[];
    selectedUserIndex: number;
}

export const mentions = createUserMentionAction();

function createUserMentionAction(): UserMentionAction {
    const modifierKeyIgnoreList = ['Shift', 'Control', 'Alt', 'Meta'];
    const mentionsWindowProps = $state<MentionsProps>({
        show: false,
        inputElement: null as HTMLDivElement | null,
        userList: [],
        selectedUserIndex: 0,
    });

    let currentUser: User | null = null,
        users: User[] = [],
        selectedUserIndex: number = $state(0),
        lastWorkingMention: Mention | null = null;

    function attachListeners(el: HTMLDivElement) {
        el.addEventListener('keyup', handleInput);
        el.addEventListener('keydown', handleKeyDown);
    }

    function handleInput(event: KeyboardEvent) {
        if (modifierKeyIgnoreList.includes(event.key)) {
            return;
        }

        if (event.key === 'Escape') {
            mentionsWindowProps.show = false;
            //? reset state?
            return;
        }

        if (event.key === 'Enter' && mentionsWindowProps.show === true) {
            const filteredUsers = filterUsers();

            action.selectUser(filteredUsers[selectedUserIndex] as User);

            return;
        }

        if (event.key === 'Enter' && mentionsWindowProps.show === false) {
            return; // user just wants a new line
        }

        if (event.key === 'ArrowUp') {
            if (selectedUserIndex === 0) {
                return;
            }

            const filteredUsers = filterUsers();

            if (filteredUsers.length > 1 && selectedUserIndex > 0) {
                selectedUserIndex--;
            }

            mentionsWindowProps.selectedUserIndex = selectedUserIndex;

            return;
        }

        if (event.key === 'ArrowDown') {
            const filteredUsers = filterUsers();

            if (selectedUserIndex === filteredUsers.length - 1) {
                return;
            }

            if (filteredUsers.length > 1 && selectedUserIndex < filteredUsers.length) {
                selectedUserIndex++;
            }

            mentionsWindowProps.selectedUserIndex = selectedUserIndex;

            return;
        }

        const cursorPosition = getCursorPosition(); // always relative to visible characters (innerText)
        const completedMentionsInComment = getCompletedMentionsInComment(mentionsWindowProps.inputElement!);
        const completedMentionAtCursor = getCompletedMentionAtCursor(completedMentionsInComment, cursorPosition);

        if (completedMentionAtCursor && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
            return; // user does not intend to edit a mention
        }

        if (completedMentionAtCursor !== null) {
            // if we have a match here, we need to strip styling and display the edited mention text to the user,
            mentionsWindowProps.inputElement!.innerHTML = removeCurrentMentionSpan(
                mentionsWindowProps.inputElement?.innerHTML ?? '',
                completedMentionAtCursor.text
            );

            setCursorPosition(cursorPosition);
            lastWorkingMention = completedMentionAtCursor;
            mentionsWindowProps.userList = filterUsers();
            if (mentionsWindowProps.userList.length > 0) {
                mentionsWindowProps.show = true;
            } else {
                mentionsWindowProps.show = false;
            }

            return;
        }

        const currentMention = getWorkingMentionAtCursor(mentionsWindowProps.inputElement!, cursorPosition);

        // there was a working mention on the previous event = user typing @name...
        if (currentMention === null && lastWorkingMention !== null) {
            // user has indicated exit of a mention
            mentionsWindowProps.show = false;

            return;
        }

        if (currentMention !== null) {
            lastWorkingMention = currentMention;
            mentionsWindowProps.userList = filterUsers();
            if (mentionsWindowProps.userList.length > 0) {
                mentionsWindowProps.show = true;
            } else {
                mentionsWindowProps.show = false;
            }
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        // In order to prevent the insertion of a new line when the
        // user intends to accept the highlighted mention, we have
        // to listen on keydown and prevent the default.
        if (
            mentionsWindowProps.show === true &&
            (event.key === 'Enter' || event.key === 'ArrowUp' || event.key === 'ArrowDown')
        ) {
            event.preventDefault();
        }
    }

    // @returns the cursor position based on the visible characters (innerText)
    function getCursorPosition() {
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        const clonedRange = range?.cloneRange();

        if (clonedRange) {
            clonedRange?.selectNodeContents(mentionsWindowProps.inputElement as Node);
            clonedRange?.setEnd(range?.endContainer as Node, range?.endOffset as number);

            return clonedRange?.toString().length;
        }

        return 0;
    }

    function setCursorPosition(targetPosition: number) {
        const range = createRange(mentionsWindowProps.inputElement as HTMLElement, targetPosition);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
    }

    const createRange = (node: HTMLElement, targetPosition: number) => {
        const range = document.createRange();
        let pos = 0;
        const stack = [node];
        while (stack.length > 0) {
            const current = stack.pop();

            if (current?.nodeType === Node.TEXT_NODE) {
                const len = current.textContent?.length;
                if (len !== undefined && pos + len >= targetPosition) {
                    range.setStart(current, targetPosition - pos);
                    range.setEnd(current, targetPosition - pos);
                    return range;
                }
                if (len !== undefined) {
                    pos += len;
                }
            } else if (current?.childNodes && current.childNodes.length > 0) {
                for (let i = current.childNodes.length - 1; i >= 0; i--) {
                    stack.push(current.childNodes[i] as HTMLElement);
                }
            }
        }
        return range;
    };

    function getWorkingMentionAtCursor(element: HTMLDivElement, cursorPosition: number): Mention | null {
        // (?<!<span[^>]*>): Negative lookbehind assertion to ensure the @<text> is not preceded by <span followed by any characters until >.
        // (?<=\s|^): Positive lookbehind assertion to ensure the @<text> is preceded by a space (\s) or is at the start of the string (^).
        // @[A-Za-z\s'()+]*: Matches the `@` pattern.
        const pattern = /(?<!<span[^>]*>)(?<=\s|^)@[A-Za-z\s'()`+]*/g;
        const htmlCursorPosition = mapCursorPositionToInnerHtml(element.innerText, element.innerHTML, cursorPosition);
        const htmlUpToCursor = element.innerHTML.slice(0, htmlCursorPosition);
        const matches = htmlUpToCursor.match(pattern);

        if (matches) {
            if (userIndicatedEndOfMention(element, cursorPosition)) {
                return null;
            }

            return {
                start: element.innerText.indexOf(matches[0]),
                end: cursorPosition,
                text: matches[0],
            } as Mention;
        }

        return null;
    }

    function getCompletedMentionAtCursor(mentions: Mention[], cursorPosition: number): Mention | null {
        for (const mention of mentions) {
            if (cursorPosition >= mention.start && cursorPosition <= mention.end) {
                return mention;
            }
        }

        return null;
    }

    function getCompletedMentionsInComment(element: HTMLDivElement): Mention[] {
        const spanMentionTexts = getSpanMentionsTextFromInnerHtml(element.innerHTML);
        const mentions: Mention[] = [];

        for (const text of spanMentionTexts) {
            const start = element.innerText.indexOf(text);
            const end = start + text.length;
            mentions.push({ start, end, text });
        }

        return mentions;
    }

    function getSpanMentionsTextFromInnerHtml(html: string): string[] {
        const mentionPattern = /<span[^>]*>@[A-Za-z\s'()`+]*<\/span>/g;
        const spanMentions = [];

        let match;
        while ((match = mentionPattern.exec(html)) !== null) {
            const startSpan = match[0].match(/<span[^>]*>/g)![0];
            const text = match[0].replace(startSpan, '').replace('</span>', '');
            spanMentions.push(text);
        }

        return spanMentions;
    }

    function removeCurrentMentionSpan(text: string, mentionText: string) {
        const mentionTextEscaped = mentionText.replace(/[-^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`<span[^>]*>${mentionTextEscaped}</span>`, 'g');

        return text.replace(regex, mentionText);
    }

    function userIndicatedEndOfMention(element: HTMLDivElement, cursorPosition: number): boolean {
        const text = element.innerText;
        const lastTwoCharacters = text.slice(cursorPosition - 2, cursorPosition);
        //Cases not caught by regex pattern:
        const delimiters = ['  ', ' .', '. ', '\n', '\r', '\t'];

        return delimiters.includes(lastTwoCharacters);
    }

    function filterUsers(): User[] {
        let usersInCompany: User[];
        usersInCompany = users.filter((u: User) => u.company.id === currentUser?.company.id);

        if (lastWorkingMention !== null) {
            usersInCompany = usersInCompany.filter((u: User) => {
                return u.name.toLowerCase().includes(lastWorkingMention!.text.slice(1).toLowerCase());
            });
        }

        return usersInCompany;
    }

    function mapCursorPositionToInnerHtml(innerText: string, innerHtml: string, cursorPosition: number) {
        let textPos = 0;
        let htmlPos = 0;
        let insideTag = false;

        for (let i = 0; i < innerHtml.length; i++) {
            const char = innerHtml[i];

            if (char === '<') {
                insideTag = true;
            } else if (char === '>') {
                insideTag = false;
                htmlPos++;
                continue;
            }

            if (!insideTag) {
                if (textPos === cursorPosition) {
                    return htmlPos;
                }
                textPos++;
            }

            htmlPos++;
        }

        return htmlPos;
    }

    function resetMentionState() {
        mentionsWindowProps.show = false;
        mentionsWindowProps.userList = users;
        mentionsWindowProps.selectedUserIndex = 0;
        selectedUserIndex = 0;
        lastWorkingMention = null;
    }

    function action(el: HTMLDivElement, params: { dbValue: string; userList: User[]; currentUser: User }) {
        if (!el) return;

        // --- logic when action inits ---
        attachListeners(el);

        // update the params with the element and comment dbValue that has been parsed for display
        mentionsWindowProps.inputElement = el;
        users = params.userList ?? [];
        currentUser = params.currentUser;

        if (params.dbValue !== '') {
            el.innerHTML = parseCommentDbTextIntoDisplayHtml(params.dbValue, params.userList);
        }

        // initialize the mentions window adding CompanyUserMentions.svelte to the page
        const mentionsWindow = mount(CompanyUserMentions, {
            target: document.body,
            props: mentionsWindowProps,
        });

        return {
            destroy: () => {
                el.removeEventListener('keyup', handleInput);
                el.removeEventListener('keydown', handleKeyDown);
                unmount(mentionsWindow);
                resetMentionState();
            },
        };
    }

    action.selectUser = function (user: User) {
        //! we should never have lastWorkingMention === null here
        if (lastWorkingMention === null) {
            throw new Error('lastWorkingMention is null on user select');
        }

        const innerHtml = mentionsWindowProps.inputElement!.innerHTML;
        const replacePattern = new RegExp(`(^|\\s)${lastWorkingMention!.text}(\\s|$)*`, 'g');
        let dbtext = parseHtmlIntoCommentDbText(innerHtml, users);

        let newCursorPosition = lastWorkingMention!.end - lastWorkingMention!.text.length + user.name.length + 1; // +1 for @
        let replacementText = generateMentionPlaceholder(user);
        const replacementMatches = dbtext.match(replacePattern);

        if (replacementMatches) {
            if (replacementMatches[0].slice(0, 1) === ' ') {
                // we have a space in front
                replacementText = ` ${replacementText} `;
                newCursorPosition++;
            } else {
                replacementText = `${replacementText} `;
                newCursorPosition++;
            }

            dbtext = dbtext.replace(replacementMatches[0], replacementText);
        }

        const newInnerHtml = parseCommentDbTextIntoDisplayHtml(dbtext, users);
        mentionsWindowProps.inputElement!.innerHTML = newInnerHtml;

        // Trigger a custom input event to notify Svelte of the change
        const event = new Event('input', { bubbles: true });
        mentionsWindowProps.inputElement!.dispatchEvent(event);

        // Focus back on the textarea
        setTimeout(() => {
            mentionsWindowProps.inputElement?.focus();
            setCursorPosition(newCursorPosition);
        }, 0);

        resetMentionState();
    };

    return action;
}

export function parseCommentDbTextIntoDisplayHtml(dbText: string, userList: User[]) {
    const pattern = /\{@\d+\|([^}]+)}/g;
    const matches = dbText.match(pattern);

    if (!matches) {
        return dbText;
    }

    const parsedUserMatches = matches.map((match) => {
        let userName = '';
        const userId = parseInt(match.match(/\d+/)![0]);

        if (!userList) {
            return generateMentionDisplay(match.match(/[A-Za-z\s'()`+]+/)![0]);
        }

        const user = userList.find((u) => u.id === userId);

        if (user) {
            userName = user.name;
        } else {
            userName = match.match(/[A-Za-z\s'()`+]+/)![0];
        }

        return generateMentionDisplay(userName);
    });

    let displayText = dbText;
    for (let i = 0; i < matches.length; i++) {
        displayText = displayText.replace(matches[i]!, parsedUserMatches[i]!);
    }

    return displayText;
}

export function parseHtmlIntoCommentDbText(html: string, userList: User[]) {
    const pattern = /<span[^>]*>@[A-Za-z\s'()`+]*<\/span>/g;
    return html.replace(pattern, (match) => {
        const spanText = match
            .replace(/<span[^>]*>/g, '')
            .replace('</span>', '')
            .slice(1); //?
        const user = userList.find((u) => u.name === spanText);
        // if the user is not found, we have an issue with the supplied user list
        return generateMentionPlaceholder(user!);
    });
}

export function generateMentionDisplay(userName: string) {
    return `<span class="text-neutral bg-primary p-1 rounded-sm">@${userName}</span>`;
}

export function generateMentionPlaceholder(user: User) {
    return `{@${user.id}|${user.name}}`;
}
