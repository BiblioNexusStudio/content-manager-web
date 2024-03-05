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
    parseHTML() {
        return [
            {
                tag: 'span',
                getAttrs: (node) => {
                    let bnType = (node as HTMLElement).getAttribute('data-bnType');
                    if (bnType === 'bibleReference') {
                        return {
                            verses: [
                                {
                                    startVerse: (node as HTMLElement).getAttribute('data-startVerse'),
                                    endVerse: (node as HTMLElement).getAttribute('data-endVerse'),
                                },
                            ],
                        };
                    }

                    return false;
                },
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            {
                'data-bnType': 'bibleReference',
                'data-startVerse': HTMLAttributes.verses[0].startVerse,
                'data-endVerse': HTMLAttributes.verses[0].endVerse,
                style: 'color: green',
            },
            0,
        ];
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
    parseHTML() {
        return [
            {
                tag: 'span',
                getAttrs: (node) => {
                    let bnType = (node as HTMLElement).getAttribute('data-bnType');
                    if (bnType === 'resourceReference') {
                        return {
                            resourceId: (node as HTMLElement).getAttribute('data-resourceId'),
                            resourceType: (node as HTMLElement).getAttribute('data-resourceType'),
                        };
                    }

                    return false;
                },
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            {
                'data-bnType': 'resourceReference',
                'data-resourceId': HTMLAttributes.resourceId,
                'data-resourceType': HTMLAttributes.resourceType,
                style: 'color: blue',
            },
            0,
        ];
    },
});
