import { Mark } from '@tiptap/core';

export const bibleReferenceMark = Mark.create({
    name: 'bibleReference',
    priority: 1001,
    keepOnSplit: false,
    addAttributes() {
        return {
            verses: {
                default: [
                    {
                        startVerse: null,
                        endVerse: null,
                    },
                ],
            },
        };
    },
    renderHTML() {
        return ['span', { style: 'color: green' }, 0];
    },
});

export const resourceReferenceMark = Mark.create({
    name: 'resourceReference',
    priority: 1001,
    keepOnSplit: false,
    addAttributes() {
        return {
            resourceId: {
                default: null,
            },
            resourceType: {
                default: null,
            },
        };
    },
    renderHTML() {
        return ['span', { style: 'color: yellow' }, 0];
    },
});
